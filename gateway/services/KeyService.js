import crypto from "crypto";

const KEY_LABEL = "gw_live_";
const PREFIX_RANDOM_CHARS = 8;

export const hashKey = (key) =>
  crypto.createHash("sha256").update(key).digest("hex");

export const getPrefix = (key) =>
  key.slice(0, KEY_LABEL.length + PREFIX_RANDOM_CHARS);

export const generateApiKey = () => {
  const randomPart = crypto.randomBytes(32).toString("hex");
  const key = `${KEY_LABEL}${randomPart}`;

  return {
    key,
    prefix: getPrefix(key),
    hash: hashKey(key),
  };
};
