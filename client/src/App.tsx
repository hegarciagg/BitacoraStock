import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PortfolioDetail from "./pages/PortfolioDetail";
import SimulationAnalysis from "./pages/SimulationAnalysis";
import Recommendations from "./pages/Recommendations";
import DiversificationAnalysis from "./pages/DiversificationAnalysis";
import SimulationHistory from "./pages/SimulationHistory";
import PortfolioComparator from "./pages/PortfolioComparator";
import ScenarioAnalysis from "./pages/ScenarioAnalysis";
import Backtesting from "./pages/Backtesting";
import SentimentAnalysisPage from "./pages/SentimentAnalysisPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/portfolio/:portfolioId" component={PortfolioDetail} />
      <Route path="/portfolio/:portfolioId/simulation" component={SimulationAnalysis} />
      <Route path="/portfolio/:portfolioId/recommendations" component={Recommendations} />
      <Route path="/portfolio/:portfolioId/diversification" component={DiversificationAnalysis} />
      <Route path="/portfolio/:portfolioId/history" component={SimulationHistory} />
      <Route path="/portfolio/:portfolioId/scenarios" component={ScenarioAnalysis} />
      <Route path="/backtesting" component={Backtesting} />
      <Route path="/sentiment" component={SentimentAnalysisPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/compare" component={PortfolioComparator} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
