import { aerospaceDomain } from "./aerospace/domain";
import { embeddedDomain } from "./embedded/domain";
import { energyDomain } from "./energy/domain";
import { industrialDomain } from "./industrial/domain";
import { iotDomain } from "./iot/domain";
import { roboticsDomain } from "./robotics/domain";
import { CodeTargetDefinition, DomainId, DomainModuleDefinition, LibrarySection } from "./types";

export const domainModules: DomainModuleDefinition[] = [roboticsDomain, embeddedDomain, iotDomain, aerospaceDomain, energyDomain, industrialDomain];

export function getDomainModule(domainId: DomainId) {
  return domainModules.find((module) => module.id === domainId) ?? embeddedDomain;
}

export function getLibrarySectionsForDomains(domainIds: DomainId[]): LibrarySection[] {
  return domainModules
    .filter((module) => domainIds.includes(module.id))
    .flatMap((module) => module.librarySections);
}

export function getCodeTargetsForComponentTypes(componentTypes: string[]): CodeTargetDefinition[] {
  const matches = domainModules.flatMap((module) =>
    module.codeTargets.filter((target) => target.componentTypes.some((componentType) => componentTypes.includes(componentType))),
  );
  return matches.filter((target, index) => matches.findIndex((candidate) => candidate.id === target.id) === index);
}

export function getDefaultDomainSelection(): DomainId[] {
  return domainModules.map((module) => module.id);
}
