import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@humansignal/ui";
import { useAPI } from "../../providers/ApiProvider";
import { useProject } from "../../providers/ProjectProvider";
import { cn } from "../../utils/bem";
import "./TaskAllocationSettings.scss";

const rootClass = cn("task-allocation");

export const TaskAllocationSettings = () => {
  const api = useAPI();
  const { project } = useProject();

  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [allocating, setAllocating] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!project?.id) return;
    setLoadingMembers(true);
    try {
      const data = await api.callApi("projectMembers", {
        params: { pk: project.id },
      });
      setMembers(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  }, [project, api]);

  const fetchUnassignedTasks = useCallback(async () => {
    if (!project?.id) return;
    setLoadingTasks(true);
    try {
      const data = await api.callApi("taskAllocationList", {
        params: { pk: project.id, assigned: "false" },
      });
      setTasks(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  }, [project, api]);

  const fetchAllTasks = useCallback(async () => {
    if (!project?.id) return;
    setLoadingTasks(true);
    try {
      const data = await api.callApi("taskAllocationList", {
        params: { pk: project.id },
      });
      setAllTasks(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  }, [project, api]);

  useEffect(() => {
    fetchMembers();
    fetchAllTasks();
  }, [fetchMembers, fetchAllTasks]);

  useEffect(() => {
    if (viewMode === "allocate") {
      fetchUnassignedTasks();
      fetchMembers();
      setSelectedMember(null);
      setSelectedTasks([]);
    }
  }, [viewMode, fetchUnassignedTasks, fetchMembers]);

  const handleTaskToggle = (taskId) => {
    setSelectedTasks((prev) => {
      if (prev.includes(taskId)) return prev.filter((id) => id !== taskId);
      return [...prev, taskId];
    });
  };

  const handleSelectAllTasks = () => {
    if (tasks.length > 0 && selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map((t) => t.id));
    }
  };

  const handleAllocate = async () => {
    if (!selectedMember || selectedTasks.length === 0) return;
    setAllocating(true);
    try {
      await api.callApi("taskAllocate", {
        params: { pk: project.id },
        body: {
          member_id: selectedMember,
          task_ids: selectedTasks,
        },
      });
      setViewMode("list");
      setSelectedMember(null);
      setSelectedTasks([]);
      fetchAllTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setAllocating(false);
    }
  };

  const getTaskLabel = (task) => {
    if (!task.data) return `Task #${task.id}`;
    const firstKey = Object.keys(task.data)[0];
    if (!firstKey) return `Task #${task.id}`;
    const val = String(task.data[firstKey]);
    return val.length > 60 ? `${val.slice(0, 60)}...` : val;
  };

  const memberMap = useMemo(() => {
    const map = {};
    for (const m of members) {
      if (m.user) map[m.user.id] = m.user;
    }
    return map;
  }, [members]);

  const renderListView = () => (
    <div className={rootClass.elem("list-view")}>
      <div className={rootClass.elem("table-header")}>
        <div className={rootClass.elem("col-id")}>Task ID</div>
        <div className={rootClass.elem("col-data")}>Data</div>
        <div className={rootClass.elem("col-assigned")}>Assigned To</div>
      </div>
      <div className={rootClass.elem("table-body")}>
        {loadingTasks ? (
          <div className={rootClass.elem("loading")}>Loading...</div>
        ) : allTasks.length === 0 ? (
          <div className={rootClass.elem("empty")}>No tasks in this project</div>
        ) : (
          allTasks.map((task) => (
            <div key={task.id} className={rootClass.elem("row")}>
              <div className={rootClass.elem("col-id")}>#{task.id}</div>
              <div className={rootClass.elem("col-data")} title={getTaskLabel(task)}>
                {getTaskLabel(task)}
              </div>
              <div className={rootClass.elem("col-assigned")}>
                {task.allocated_to?.length > 0 ? (
                  <span className={rootClass.elem("assigned")}>
                    {task.allocated_to.map((u) => u.email || `User #${u.id}`).join(", ")}
                  </span>
                ) : (
                  <span className={rootClass.elem("unassigned")}>Unassigned</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderAllocateView = () => (
    <div className={rootClass.elem("allocate-view")}>
      <div className={rootClass.elem("column")}>
        <h3 className={rootClass.elem("column-header")}>Select Member</h3>
        <div className={rootClass.elem("list")}>
          {loadingMembers ? (
            <div className={rootClass.elem("loading")}>Loading...</div>
          ) : members.length === 0 ? (
            <div className={rootClass.elem("empty")}>No members found</div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className={rootClass.elem("item").mod({ "member-selected": selectedMember === member.id })}
                onClick={() => setSelectedMember(member.id)}
              >
                <div className={rootClass.elem("member-info")}>
                  <div className={rootClass.elem("member-email")}>{member.user?.email}</div>
                  <div className={rootClass.elem("member-name")}>
                    {member.user?.first_name} {member.user?.last_name}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={rootClass.elem("column")}>
        <h3 className={rootClass.elem("column-header")}>
          Select Tasks
          {tasks.length > 0 && (
            <span className={rootClass.elem("select-all")} onClick={handleSelectAllTasks}>
              {selectedTasks.length === tasks.length ? "Deselect All" : "Select All"}
            </span>
          )}
        </h3>
        <div className={rootClass.elem("list")}>
          {loadingTasks ? (
            <div className={rootClass.elem("loading")}>Loading...</div>
          ) : tasks.length === 0 ? (
            <div className={rootClass.elem("empty")}>No unassigned tasks found</div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={rootClass.elem("item").mod({ selected: selectedTasks.includes(task.id) })}
                onClick={() => handleTaskToggle(task.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedTasks.includes(task.id)}
                  readOnly
                  className={rootClass.elem("checkbox")}
                />
                <div className={rootClass.elem("task-info")}>
                  <div className={rootClass.elem("task-id")}>#{task.id}</div>
                  <div className={rootClass.elem("task-data")}>{getTaskLabel(task)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={rootClass}>
      <div className={rootClass.elem("toolbar")}>
        <h3 className={rootClass.elem("title")}>
          {viewMode === "list" ? "Task Allocation" : "Allocate Tasks to Member"}
        </h3>
        <div className={rootClass.elem("toolbar-actions")}>
          {viewMode === "list" ? (
            <Button onClick={() => setViewMode("allocate")} look="primary" size="small">
              Allocate Tasks
            </Button>
          ) : (
            <>
              <Button onClick={() => setViewMode("list")} size="small">
                Back
              </Button>
              <Button
                onClick={handleAllocate}
                look="primary"
                size="small"
                disabled={!selectedMember || selectedTasks.length === 0}
                waiting={allocating}
              >
                Allocate ({selectedTasks.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {viewMode === "list" ? renderListView() : renderAllocateView()}
    </div>
  );
};

TaskAllocationSettings.title = "Task Allocation";
TaskAllocationSettings.path = "/task-allocation";
