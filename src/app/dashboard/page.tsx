"use client";

import { useStore } from "@/lib/store/useStore";
import AppLayout from "@/components/layout/AppLayout";
import PomodoroWidget from "@/components/widgets/PomodoroWidget";
import TaskList from "@/components/widgets/TaskList";
import QuickNotes from "@/components/widgets/QuickNotes";
import StudyAnalytics from "@/components/widgets/StudyAnalytics";
import GradeCalculator from "@/components/widgets/GradeCalculator";
import AmbientSounds from "@/components/widgets/AmbientSounds";
import DailyQuote from "@/components/widgets/DailyQuote";

export default function DashboardPage() {
  const { zenMode } = useStore();

  return (
    <AppLayout>
      {zenMode ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
          <div className="flex flex-col lg:flex-row items-center gap-8 max-w-4xl w-full">
            <div className="w-full max-w-md"><PomodoroWidget /></div>
            <div className="w-full max-w-md"><AmbientSounds /></div>
          </div>
        </div>
      ) : (
        <div className="max-w-[1400px] mx-auto space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 space-y-5">
              <PomodoroWidget />
              <DailyQuote />
              <AmbientSounds />
            </div>
            <div className="lg:col-span-5 space-y-5">
              <TaskList />
              <QuickNotes />
            </div>
            <div className="lg:col-span-3 space-y-5">
              <StudyAnalytics />
              <GradeCalculator />
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#a855f7]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ec4899]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#06b6d4]/3 rounded-full blur-[150px]" />
      </div>
    </AppLayout>
  );
}
