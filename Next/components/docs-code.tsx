"use client";
import { useState } from "react";
import { Terminal } from "lucide-react";
import { CopyButton } from "./copy";
export function DocsCode({
  samples,
}: {
  samples: { label: string; value: string }[];
}) {
  const [selected, setSelected] = useState(0);
  const sample = samples[selected];
  return (
    <div className="docs-code">
      <div className="docs-code-top">
        <Terminal size={13} />
        <div>
          {samples.map((entry, index) => (
            <button
              key={entry.label}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <CopyButton value={sample.value} />
      </div>
      <pre>
        <code>
          {sample.value.split("\n").map((line, index) => (
            <span className="docs-code-line" key={index}>
              <span className="code-line-number" aria-hidden="true">
                {index + 1}
              </span>
              <span>
                {line
                  .split(/("[^"]*"|'[^']*'|--[\w-]+|\$\w+|#.*)/g)
                  .map((part, partIndex) => (
                    <span
                      key={partIndex}
                      className={
                        part.startsWith("#")
                          ? "code-comment"
                          : part.startsWith("--")
                            ? "code-option"
                            : /^['"$]/.test(part)
                              ? "code-string"
                              : undefined
                      }
                    >
                      {part || " "}
                    </span>
                  ))}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
