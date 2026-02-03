import { api } from './services/supabaseService';
import { UserRole } from './types';

async function runTests() {
    console.log('--- Starting Logic Tests ---');

    try {
        // Test 1: login
        console.log('Test 1: Login');
        const user = await api.login('hr@mentorlink.com');
        if (user && user.email === 'hr@mentorlink.com') {
            console.log('✅ Login successful');
        } else {
            console.log('❌ Login failed');
            process.exit(1);
        }

        // Test 2: getTenants
        console.log('Test 2: Get Tenants');
        const tenants = await api.getTenants();
        if (tenants.length > 0 && tenants[0].slug === 'mentorlink') {
            console.log(`✅ Found ${tenants.length} tenants correctly`);
        } else {
            console.log('❌ No tenants found or incorrect data');
            process.exit(1);
        }

        // Test 3: getUsers
        console.log('Test 3: Get Users (Mentors)');
        const mentors = await api.getUsers(UserRole.MENTOR);
        if (mentors.length > 0) {
            console.log(`✅ Found ${mentors.length} mentors`);
        } else {
            console.log('❌ No mentors found');
            process.exit(1);
        }

        // Test 4: assignMentor
        console.log('Test 4: Assign Mentor');
        const mentee = (await api.getUsers(UserRole.MENTEE))[0];
        const mentor = mentors[0];
        // Cast user as any to access properties if TS complains about null, though we checked it
        const hrAdmin = user!;

        // Check initial state
        if (mentee.assigned_mentor_id === mentor.user_id) {
            console.log('Note: Mentee already assigned to this mentor. Testing re-assignment or existing logic.');
        }

        await api.assignMentor(hrAdmin, mentee.user_id, mentor.user_id);
        const users = await api.getUsers();
        const updatedMentee = users.find(u => u.user_id === mentee.user_id);

        if (updatedMentee?.assigned_mentor_id === mentor.user_id) {
            console.log('✅ Mentor assigned successfully');
        } else {
            console.log('❌ Mentor assignment failed');
            process.exit(1);
        }

        // Test 5: getGlobalAnalytics
        console.log('Test 5: Global Analytics');
        const analytics = await api.getGlobalAnalytics(hrAdmin);
        if (analytics.overview.totalMentors > 0) {
            console.log('✅ Global analytics retrieved successfully');
        } else {
            console.log('❌ Global analytics failed');
            process.exit(1);
        }

        console.log('\n✨ ALL LOGIC TESTS PASSED! ✨');
        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        process.exit(1);
    }
}

runTests();
