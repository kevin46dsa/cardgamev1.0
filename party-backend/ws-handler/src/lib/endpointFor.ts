// Raw execute-api host needs the stage in the path; a custom domain mapped at root does not.
export function endpointFor({ domainName, stage }: { domainName?: string; stage: string }): string {
  return domainName?.endsWith(".amazonaws.com") ? `https://${domainName}/${stage}` : `https://${domainName}`;
}
