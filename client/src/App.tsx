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
import AnalysisHub from "./pages/AnalysisHub";
import ProfilePage from "./pages/ProfilePage";
import HMMTradingSystem from "./pages/HMMTradingSystem";
import UserSettings from "./pages/UserSettings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import EmailVerified from "./pages/EmailVerified";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/email-verified" component={EmailVerified} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/portfolio/:portfolioId" component={PortfolioDetail} />
      <Route path="/portfolio/:portfolioId/simulation" component={SimulationAnalysis} />
      <Route path="/portfolio/:portfolioId/recommendations" component={Recommendations} />
      <Route path="/portfolio/:portfolioId/diversification" component={DiversificationAnalysis} />
      <Route path="/portfolio/:portfolioId/history" component={SimulationHistory} />
      <Route path="/portfolio/:portfolioId/scenarios" component={ScenarioAnalysis} />
      <Route path="/analysis" component={AnalysisHub} />
      <Route path="/backtesting">{() => { window.location.replace('/analysis'); return null; }}</Route>
      <Route path="/sentiment">{() => { window.location.replace('/analysis'); return null; }}</Route>
      <Route path="/hmm-trading" component={HMMTradingSystem} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/settings" component={UserSettings} />
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
        defaultTheme="light"
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
