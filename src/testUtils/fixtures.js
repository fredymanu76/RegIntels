// ============================================================================
// TEST FIXTURES HELPER
// ============================================================================
// Loads markdown fixture files for use in policy assessment tests.
// Uses Node.js fs/path — not browser-compatible (test-only).
// ============================================================================

const fs = require('fs');
const path = require('path');

const FIXTURES_ROOT = path.resolve(__dirname, '../../test-fixtures');

/**
 * Load a fixture file and return its text content.
 * @param {'GOOD'|'BAD'} quality - Fixture quality tier
 * @param {string} filename - e.g. 'aml-policy-good.md'
 * @returns {string} File content as UTF-8 text
 */
function loadFixture(quality, filename) {
  const filePath = path.join(FIXTURES_ROOT, quality, filename);
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Load all GOOD fixtures.
 * @returns {{ aml: string, safeguarding: string, governance: string, businessPlan: string }}
 */
function loadGoodFixtures() {
  return {
    aml: loadFixture('GOOD', 'aml-policy-good.md'),
    safeguarding: loadFixture('GOOD', 'safeguarding-policy-good.md'),
    governance: loadFixture('GOOD', 'governance-policy-good.md'),
    businessPlan: loadFixture('GOOD', 'business-plan-good.md'),
  };
}

/**
 * Load all BAD fixtures.
 * @returns {{ aml: string, safeguarding: string, governance: string, businessPlan: string }}
 */
function loadBadFixtures() {
  return {
    aml: loadFixture('BAD', 'aml-policy-bad.md'),
    safeguarding: loadFixture('BAD', 'safeguarding-policy-bad.md'),
    governance: loadFixture('BAD', 'governance-policy-bad.md'),
    businessPlan: loadFixture('BAD', 'business-plan-bad.md'),
  };
}

module.exports = { loadFixture, loadGoodFixtures, loadBadFixtures, FIXTURES_ROOT };
