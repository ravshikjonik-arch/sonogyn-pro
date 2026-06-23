import { auditNavigationIconMappings } from "../lib/modules/navigation-icon-audit";

const result = auditNavigationIconMappings();

console.log(`[audit:navigation-icons] mapped icon names: ${result.mappedIconCount}`);
console.log(`[audit:navigation-icons] unmapped icon names (${result.unmappedIconNames.length}):`);
for (const icon of result.unmappedIconNames) {
  console.log(`  - ${icon}`);
}

console.log(
  `[audit:navigation-icons] modules with missing mapping (${result.modulesWithMissingMapping.length}):`,
);
for (const entry of result.modulesWithMissingMapping) {
  console.log(`  - ${entry.id} | ${entry.icon} | ${entry.domain} | ${entry.title}`);
}

if (!result.ok) {
  process.exitCode = 1;
}
