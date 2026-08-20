import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export default function SessionChart({
  scheduled,
  completed,
}) {
  const data = {
    labels: ["Scheduled", "Completed"],

    datasets: [
      {
        data: [scheduled, completed],
      },
    ],
  };

  return (
    <div
      style={{
        width: "400px",
        marginTop: "30px",
      }}
    >
      <Pie data={data} />
    </div>
  );
}