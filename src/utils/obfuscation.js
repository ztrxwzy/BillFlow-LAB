function encodeBase64Id(id) {
  return Buffer.from(String(id), "utf8").toString("base64");
}

function decodeBase64Id(encoded) {
  try {
    const decoded = Buffer.from(String(encoded), "base64").toString("utf8");
    const parsed = Number(decoded);
    if (!Number.isInteger(parsed) || parsed <= 0) return null;
    if (String(parsed) !== decoded.trim()) return null;
    return parsed;
  } catch (err) {
    return null;
  }
}

module.exports = {
  encodeBase64Id,
  decodeBase64Id
};
