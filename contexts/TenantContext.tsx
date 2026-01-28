
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, UserRole, Permission, TenantLabels } from '../types';
import { api } from '../services/supabaseService';

interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    setTenant: (tenant: Tenant) => void;
    availableTenants: Tenant[]; // For demo/development purposes
    getLabel: (key: keyof TenantLabels) => string;
    hasPermission: (role: UserRole | string, permission: Permission) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, we would resolve tenant from subdomain or URL path
        // For this demo, we'll fetch all tenants and default to the first one or let user pick
        const loadTenants = async () => {
            try {
                const tenants = await api.getTenants();
                setAvailableTenants(tenants);
                if (tenants.length > 0) {
                    // Default to first tenant (MentorLink)
                    setTenant(tenants[0]);

                    // Apply tenant theme
                    if (tenants[0].config?.primary_color) {
                        document.documentElement.style.setProperty('--primary-color', tenants[0].config.primary_color);
                    }
                }
            } catch (err) {
                console.error("Failed to load tenants", err);
            } finally {
                setLoading(false);
            }
        };
        loadTenants();
    }, []);

    const handleSetTenant = (newTenant: Tenant) => {
        setTenant(newTenant);
        if (newTenant.config?.primary_color) {
            document.documentElement.style.setProperty('--primary-color', newTenant.config.primary_color);
        }
    };

    const getLabel = (key: keyof TenantLabels): string => {
        if (!tenant || !tenant.config?.labels) {
            // Fallback defaults
            return {
                mentor: 'Mentor',
                mentee: 'Mentee',
                program_name: 'Mentorship Program'
            }[key];
        }
        return tenant.config.labels[key] || key;
    };

    const hasPermission = (role: UserRole | string, permission: Permission): boolean => {
        if (!tenant || !tenant.config?.roles) return false;
        const roleConfig = tenant.config.roles[role];
        return roleConfig?.permissions?.includes(permission) || false;
    };

    return (
        <TenantContext.Provider value={{
            tenant,
            loading,
            setTenant: handleSetTenant,
            availableTenants,
            getLabel,
            hasPermission
        }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
