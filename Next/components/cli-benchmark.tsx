import { cliBenchmarks } from "@/lib/cli-benchmarks";

export function CliBenchmark() {
  return (
    <section
      className="section benchmark wrap"
      id="cli-performance"
      aria-labelledby="benchmark-title"
    >
      <div className="benchmark-copy">
        <p className="eyebrow">The Go CLI, measured</p>
        <h2 id="benchmark-title">
          A faster start
          <br />
          in your terminal.
        </h2>
        <p className="benchmark-description">
          The commands you know, with less waiting. Compared with the previous
          JavaScript CLI in local startup and listing benchmarks.
        </p>
        <dl className="benchmark-metrics">
          <div>
            <dt>Through npm</dt>
            <dd>
              ≈7<span>×</span>
              <small>faster in these tests</small>
            </dd>
          </div>
          <div>
            <dt>Native binary directly</dt>
            <dd>
              42–95<span>×</span>
              <small>faster in these tests</small>
            </dd>
          </div>
        </dl>
      </div>
      <div className="benchmark-results">
        <div className="benchmark-results-heading">
          <span>Fresh process · local benchmark</span>
          <span className="benchmark-lower">Lower is faster</span>
        </div>
        <table className="benchmark-table">
          <caption className="sr-only">
            Median CLI duration in milliseconds, from 60 runs per command.
          </caption>
          <thead>
            <tr>
              <th scope="col">Command</th>
              <th scope="col">
                JavaScript<span>1.0.3</span>
              </th>
              <th scope="col" className="benchmark-current">
                Go / npm<span>2.0.0</span>
              </th>
              <th scope="col">
                Go / direct<span>2.0.0</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {cliBenchmarks.rows.map((row) => (
              <tr key={row.command}>
                <th scope="row">
                  <code>{row.command}</code>
                  {row.detail && <span>{row.detail}</span>}
                </th>
                <td>
                  {row.js.toFixed(1)}
                  <span> ms</span>
                </td>
                <td className="benchmark-current">
                  {row.npm.toFixed(1)}
                  <span> ms</span>
                </td>
                <td>
                  {row.native.toFixed(1)}
                  <span> ms</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="benchmark-context">
          Measured locally. Real uploads and downloads also depend on your
          connection and service response time.
        </p>
        <details className="benchmark-method">
          <summary>How we measured</summary>
          <div>
            <p>
              {cliBenchmarks.measuredRuns} runs per command after{" "}
              {cliBenchmarks.warmups} warmups, measured sequentially in
              randomized order on {cliBenchmarks.date}. Each run started a fresh
              process with warmed file caches and discarded terminal output.
            </p>
            <p>
              Linux x86_64, Intel Core i7-1360P, Node.js 22.23.3. Listing used
              200 synthetic files served locally, without internet or production
              server latency. The npm launcher’s permission write was disabled
              during measurement to leave file permissions unchanged.
            </p>
            <p>
              The npm launcher adds startup time before the Go binary runs.
              These results compare these CLI versions; they do not measure
              production upload, download, or encryption throughput.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
