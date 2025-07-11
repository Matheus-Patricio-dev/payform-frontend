import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale);

interface TransactionChartProps {
  completed: number;
  pending: number;
  declined: number;
}

const TransactionChart: React.FC<TransactionChartProps> = ({
  completed,
  pending,
  declined,
}) => {
  const data = {
    labels: ['Aprovadas', 'Pendentes', 'Recusadas'],
    datasets: [
      {
        data: [completed, pending, declined],
        backgroundColor: [
          'hsl(142, 72%, 40%)',  // success
          'hsl(38, 92%, 50%)',   // warning
          'hsl(0, 84%, 60%)',    // error
        ],
        borderColor: [
          'hsl(142, 72%, 35%)',
          'hsl(38, 92%, 45%)',
          'hsl(0, 84%, 55%)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '70%',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status das Transações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] flex items-center justify-center">
          <Doughnut data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionChart;