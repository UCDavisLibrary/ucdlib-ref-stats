export class MissingResourceError extends Error {
  constructor(resourceType, identifier) {
    super(`${resourceType} "${identifier}" does not exist`);
    this.name = "MissingResource";
    this.resourceType = resourceType;
    this.identifier = identifier;
  }
}

export class AuthorizationError extends Error {
  constructor(message) {
    super(message || "Not authorized to access this resource.");
    this.name = "AuthorizationError";
  }
}