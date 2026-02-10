import { motion } from "framer-motion";
import { MetricTooltip, METRIC_DEFINITIONS } from "./MetricTooltip";

interface AnimatedMetricCardProps {
  label: string;
  value: number;
  unit?: string;
  metricKey: keyof typeof METRIC_DEFINITIONS;
  color?: string;
  delay?: number;
}

export function AnimatedMetricCard({
  label,
  value,
  unit,
  metricKey,
  color = "blue",
  delay = 0,
}: AnimatedMetricCardProps) {
  const definition = METRIC_DEFINITIONS[metricKey];
  const colorClasses = {
    blue: "from-blue-600/20 to-blue-900/20 border-blue-700/50",
    green: "from-green-600/20 to-green-900/20 border-green-700/50",
    purple: "from-purple-600/20 to-purple-900/20 border-purple-700/50",
    orange: "from-orange-600/20 to-orange-900/20 border-orange-700/50",
    red: "from-red-600/20 to-red-900/20 border-red-700/50",
  };

  const selectedColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-gradient-to-br ${selectedColor} rounded-lg p-4 border backdrop-blur-sm hover:shadow-lg transition-shadow`}
    >
      <MetricTooltip
        metric={label}
        value={value.toFixed(2)}
        unit={unit}
        description={definition.description}
        interpretation={definition.interpretation}
      />
    </motion.div>
  );
}
