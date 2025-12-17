import { EmailMonitoringSettings } from "@/components/settings/email-monitoring-settings";
import { EmailTemplatesSettings } from "@/components/settings/email-templates-settings";
import { EmailConfigurationSettings } from "@/components/settings/email-configuration-settings";
import { BulkImportSettings } from "@/components/settings/bulk-import-settings";
import { PipelineTemplatesSettings } from "@/components/settings/pipeline-templates-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Mail, Download, Settings, Workflow, AtSign } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("email-templates");

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-3 py-3 md:gap-4 md:py-4">
          <div className="px-3 lg:px-4">
            {/* Header */}
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                <div className="rounded-lg bg-primary/10 p-1.5 md:p-2 shrink-0">
                  <Settings className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">
                    Settings
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Manage your application settings and preferences
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0 mb-4 md:mb-6">
                <TabsList className="h-9 md:h-11 p-0.5 md:p-1 bg-card border border-border w-full md:w-fit inline-flex">
                  <TabsTrigger
                    value="email-configuration"
                    className="flex-1 md:flex-initial px-3 md:px-6 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground whitespace-nowrap"
                  >
                    <AtSign className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Email Configuration</span>
                    <span className="sm:hidden">Config</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="email-templates"
                    className="flex-1 md:flex-initial px-3 md:px-6 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground whitespace-nowrap"
                  >
                    <Mail className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Email Templates</span>
                    <span className="sm:hidden">Templates</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="email-monitoring"
                    className="flex-1 md:flex-initial px-3 md:px-6 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground whitespace-nowrap"
                  >
                    <Activity className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Email Monitoring</span>
                    <span className="sm:hidden">Monitoring</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="bulk-import"
                    className="flex-1 md:flex-initial px-3 md:px-6 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground whitespace-nowrap"
                  >
                    <Download className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Bulk Import</span>
                    <span className="sm:hidden">Import</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="pipeline-templates"
                    className="flex-1 md:flex-initial px-3 md:px-6 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground whitespace-nowrap"
                  >
                    <Workflow className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    <span className="hidden sm:inline">Pipeline Templates</span>
                    <span className="sm:hidden">Pipelines</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="email-configuration" className="mt-0">
                <EmailConfigurationSettings />
              </TabsContent>

              <TabsContent value="email-templates" className="mt-0">
                <EmailTemplatesSettings />
              </TabsContent>

              <TabsContent value="email-monitoring" className="mt-0">
                <EmailMonitoringSettings />
              </TabsContent>

              <TabsContent value="bulk-import" className="mt-0">
                <BulkImportSettings />
              </TabsContent>

              <TabsContent value="pipeline-templates" className="mt-0">
                <PipelineTemplatesSettings />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
