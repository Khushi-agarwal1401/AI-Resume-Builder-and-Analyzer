function parseList(text) {
  return text.split(",").map((s) => s.trim()).filter(Boolean);
}

let text = "React,";
let values = parseList(text);

let parsedText = parseList(text).join(", ");
let newValues = values.join(", ");

console.log({ text, parsedText, newValues, override: parsedText !== newValues });

text = "React, ";
values = parseList(text);
parsedText = parseList(text).join(", ");
newValues = values.join(", ");
console.log({ text, parsedText, newValues, override: parsedText !== newValues });

