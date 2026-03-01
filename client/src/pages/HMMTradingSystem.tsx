import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, BookOpen } from "lucide-react";

// Blueprint sections
import HeroSection from "@/components/hmm/HeroSection";
import ArchitectureDiagram from "@/components/hmm/ArchitectureDiagram";
import ModulesGrid from "@/components/hmm/ModulesGrid";
import TechnicalSpecs from "@/components/hmm/TechnicalSpecs";
import ExecutionPipeline from "@/components/hmm/ExecutionPipeline";
import FutureScalability from "@/components/hmm/FutureScalability";
import DeliverablesChecklist from "@/components/hmm/DeliverablesChecklist";

// Live dashboard
import LiveDashboard from "@/components/hmm/LiveDashboard";

export default function HMMTradingSystem() {
  return (
    <DashboardLayout>
      <div className="pb-12">
        {/* Compact hero header always visible */}
        <div className="mb-6">
          <HeroSection />
        </div>

        <Tabs defaultValue="live" className="w-full">
          <TabsList className="bg-white shadow-sm border border-slate-200 mb-6">
            <TabsTrigger
              value="live"
              className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-slate-900"
            >
              <LayoutDashboard className="w-4 h-4" />
              Live Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="blueprint"
              className="flex items-center gap-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900"
            >
              <BookOpen className="w-4 h-4" />
              Blueprint
            </TabsTrigger>
          </TabsList>

          {/* ── Live Dashboard ─────────────────────────────────────────── */}
          <TabsContent value="live">
            <LiveDashboard />
          </TabsContent>

          {/* ── Technical Blueprint ──────────────────────────────────────── */}
          <TabsContent value="blueprint">
            <div className="space-y-8">
              <ArchitectureDiagram />
              <ModulesGrid />
              <TechnicalSpecs />
              <ExecutionPipeline />
              <DeliverablesChecklist />
              <FutureScalability />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
