const isLinkRegex = /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/g;

export const isLinkOnly = (text) => {
  const matched = text.match(isLinkRegex);
  return matched != null;
};
