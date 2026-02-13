/**
 * Utility to export localStorage data for updating mockData.ts
 * Run this in the browser console or create a button to trigger it
 */

export function exportLocalStorageData() {
  try {
    const products = localStorage.getItem('timeline_view_products');
    const holidays = localStorage.getItem('timeline_view_holidays');
    const teamMembers = localStorage.getItem('timeline_view_team_members');

    const data = {
      products: products ? JSON.parse(products) : null,
      holidays: holidays ? JSON.parse(holidays) : null,
      teamMembers: teamMembers ? JSON.parse(teamMembers) : null,
      exportedAt: new Date().toISOString(),
    };

    console.log('='.repeat(80));
    console.log('LOCALSTORAGE DATA EXPORT');
    console.log('='.repeat(80));
    console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(80));
    console.log('Copy the JSON above to update mockData.ts');
    console.log('='.repeat(80));

    return data;
  } catch (error) {
    console.error('Failed to export localStorage data:', error);
    return null;
  }
}

/**
 * Browser console command to export data
 * Paste this in the browser console when app is running:
 */
export const CONSOLE_EXPORT_COMMAND = `
// Copy this command and run it in the browser console:
const data = {
  products: JSON.parse(localStorage.getItem('timeline_view_products') || 'null'),
  holidays: JSON.parse(localStorage.getItem('timeline_view_holidays') || 'null'),
  teamMembers: JSON.parse(localStorage.getItem('timeline_view_team_members') || 'null'),
  exportedAt: new Date().toISOString()
};
console.log('='.repeat(80));
console.log('EXPORTED DATA:');
console.log('='.repeat(80));
console.log(JSON.stringify(data, null, 2));
copy(JSON.stringify(data, null, 2)); // This copies to clipboard
console.log('='.repeat(80));
console.log('✓ Data copied to clipboard!');
`;
