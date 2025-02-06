const stringToIdentifier = str => {
  // Replace invalid characters with underscores and remove leading/trailing underscores
  let identifier = str.replace(/[^a-zA-Z0-9_$]/g, "").replace(/^_+|_+$/g, "");

  // Ensure the identifier doesn't start with a number
  if (/^[0-9]/.test(identifier)) {
    identifier = "_" + identifier;
  }

  if (!identifier) {
    return "_default";
  }

  return identifier;
};

export { stringToIdentifier };
