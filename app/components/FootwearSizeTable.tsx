export const FOOTWEAR_SIZE_GUIDE = [
  ["36", "22.5"],
  ["37", "23.0"],
  ["38", "23.5"],
  ["39", "24.5"],
  ["40", "25.0"],
  ["41", "25.5"],
  ["42", "26.5"],
  ["43", "27.0"],
  ["44", "28.0"],
  ["45", "28.5"],
] as const;

export function FootwearSizeTable() {
  return (
    <div className="overflow-x-auto">
      <table className="size-guide-table">
        <thead>
          <tr>
            <th scope="col">EU size</th>
            <th scope="col">Foot length (cm)</th>
          </tr>
        </thead>
        <tbody>
          {FOOTWEAR_SIZE_GUIDE.map(([size, length]) => (
            <tr key={size}>
              <th scope="row">{size}</th>
              <td>{length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
