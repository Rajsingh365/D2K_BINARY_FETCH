import React from "react";
import { Agent } from "@/lib/marketPlaceData";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, ChevronRight } from "lucide-react";
import { useAuthUser } from "@/context/AuthUserContext";

const AgentPanel = () => {
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    agent: Agent
  ) => {
    // Log the agent being dragged
    console.log("Dragging agent:", agent);

    // Store the agent ID as both string and original format
    event.dataTransfer.setData("application/agentNode", String(agent.id));
    event.dataTransfer.setData("text/plain", String(agent.id));

    // Store more complete agent data to ensure we can retrieve it during drop
    try {
      // Include more agent properties to make it easier to reconstruct
      const agentData = JSON.stringify({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        description: agent.description,
        color: agent.color || "gray",
      });
      console.log("Setting agent data:", agentData);
      event.dataTransfer.setData("application/json", agentData);
    } catch (error) {
      console.error("Error serializing agent data:", error);
    }

    event.dataTransfer.effectAllowed = "copy";

    // Add visual feedback
    if (event.dataTransfer.setDragImage && agent.name) {
      const elem = document.createElement("div");
      elem.style.position = "absolute";
      elem.style.top = "-1000px";
      elem.style.padding = "10px";
      elem.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
      elem.style.borderRadius = "4px";
      elem.style.color = "white";
      elem.textContent = agent.name;
      document.body.appendChild(elem);
      event.dataTransfer.setDragImage(elem, 0, 0);
      setTimeout(() => document.body.removeChild(elem), 0);
    }
  };

  const { usersAgent } = useAuthUser();
  console.log("Available agents:", usersAgent);

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-3">
        {usersAgent?.map((agent: Agent) => (
          <div
            key={agent.id}
            className="agent-panel-item bg-background rounded-lg p-3 flex items-center gap-3 cursor-grab hover:shadow-sm transition-all border border-muted hover:border-primary/20 relative group"
            draggable="true"
            onDragStart={(event) => onDragStart(event, agent)}
          >
            <div
              className={cn(
                "rounded-md w-10 h-10 flex items-center justify-center",
                `bg-${agent.color}-50`
              )}
            >
              {agent.icon && typeof agent.icon === "function" ? (
                <agent.icon size={18} className={`text-${agent.color}-500`} />
              ) : (
                <Bot size={18} className={`text-${agent.color}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{agent.name}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {agent.type}
              </p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 absolute right-2 text-muted-foreground transition-opacity">
              <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default AgentPanel;
