export type DomainId = "robotics" | "embedded" | "iot" | "aerospace" | "energy" | "industrial";

export type LibraryItem = {
  name: string;
  description: string;
  type: string;
  domain: DomainId;
  appearance: "3d" | "board" | "network";
};

export type LibrarySection = {
  name: string;
  icon: string;
  items: LibraryItem[];
};

export type CodeFileTemplate = {
  name: string;
  language: string;
  content: string;
};

export type CodeTargetDefinition = {
  id: string;
  label: string;
  runtime: string;
  language: string;
  chipFamily: string;
  componentTypes: string[];
  features: string[];
  files: CodeFileTemplate[];
};

export type DomainModuleDefinition = {
  id: DomainId;
  label: string;
  summary: string;
  defaultEnvironment: string;
  environments: string[];
  engines: string[];
  librarySections: LibrarySection[];
  codeTargets: CodeTargetDefinition[];
};
