import { Crown, TrendingUp, Users, BarChart3 } from "lucide-react";

export default function HowItWorksSection() {
  const steps = [
    {
      icon: <Crown className="w-6 h-6 text-orange-400" />,
      title: "Compete for Recognition",
      description:
        "Build your reputation as a top predictor and earn recognition from the community for your insights and accuracy.",
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-orange-400" />,
      title: "Monetize Your Expertise",
      description:
        "Turn your knowledge into revenue by creating markets and earning fees from trading activity on your questions.",
    },
    {
      icon: <Users className="w-6 h-6 text-orange-400" />,
      title: "Identify Skills to Monetize",
      description:
        "Discover which topics and categories showcase your predictive abilities and focus on your strengths.",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-orange-400" />,
      title: "Climb the Leaderboards",
      description:
        "Track your progress and compete with other predictors to reach the top of global and category-specific rankings.",
    },
  ];

  return (
    <section className="relative py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left side - Title and description */}
          <div className="text-center lg:text-left">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">
              Build Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                Insight
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Leverage your knowledge and analytical skills to make accurate
              predictions. Whether you're an expert or just getting started,
              InsightArena provides the tools to showcase your abilities and earn
              rewards.
            </p>
          </div>

          {/* Right side - Points with Icons */}
          <div className="relative space-y-10">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative flex flex-row items-start gap-6 group"
              >
                {/* Icon box */}
                <div className="relative z-10 flex-shrink-0 w-12 h-12 bg-gray-900/50 border border-gray-700/50 rounded-lg flex items-center justify-center shadow-lg group-hover:border-orange-500/50 transition-colors">
                  {step.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
