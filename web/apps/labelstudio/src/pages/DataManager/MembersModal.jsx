import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Checkbox, Select, Spinner, Userpic } from "@humansignal/ui";
import { IconUserAdd, IconTrash } from "@humansignal/icons";
import { useAPI } from "../../providers/ApiProvider";
import { useProject } from "../../providers/ProjectProvider";
import { Modal } from "../../components/Modal/ModalPopup";
import { cn } from "../../utils/bem";
import "./MembersModal.scss";

const ROLES = {
  annotator: "Annotator",
  reviewer: "Reviewer",
  project_manager: "Project Manager",
};

const ROLE_OPTIONS = Object.entries(ROLES).map(([value, label]) => ({ value, label }));

const ROLE_BADGE_VARIANT = {
  annotator: "secondary",
  reviewer: "info",
  project_manager: "warning",
};

const rootClass = cn("members-modal");

export const ProjectMembersModal = ({ onClose }) => {
  const api = useAPI();
  const { project } = useProject();
  const [members, setMembers] = useState([]);
  const [potentialMembers, setPotentialMembers] = useState([]);
  const [selectedPotentialMembers, setSelectedPotentialMembers] = useState({});
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchMembers = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const data = await api.callApi("projectMembers", {
        params: { pk: project.id },
      });
      setMembers(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [project, api]);

  const fetchPotentialMembers = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const data = await api.callApi("projectPotentialMembers", {
        params: { pk: project.id },
      });
      setPotentialMembers(data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [project, api]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (showAddMember) {
      fetchPotentialMembers();
      setSearchQuery("");
    }
  }, [showAddMember, fetchPotentialMembers]);

  const filteredPotentialMembers = useMemo(() => {
    if (!searchQuery.trim()) return potentialMembers;
    const q = searchQuery.toLowerCase();
    return potentialMembers.filter(
      (user) =>
        user.email?.toLowerCase().includes(q) ||
        user.first_name?.toLowerCase().includes(q) ||
        user.last_name?.toLowerCase().includes(q),
    );
  }, [potentialMembers, searchQuery]);

  const handleSave = async () => {
    const userIds = Object.keys(selectedPotentialMembers);
    if (userIds.length === 0) return;

    setSaving(true);
    try {
      const membersPayload = userIds.map((id) => ({
        user_id: Number(id),
        role: selectedPotentialMembers[id],
      }));

      await api.callApi("addProjectMembers", {
        params: { pk: project.id },
        body: { members: membersPayload },
      });
      setShowAddMember(false);
      setSelectedPotentialMembers({});
      fetchMembers();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedMembers.size === 0) return;

    await api.callApi("deleteProjectMembers", {
      params: { pk: project.id },
      body: { project_member_ids: Array.from(selectedMembers) },
    });

    setSelectedMembers(new Set());
    fetchMembers();
  };

  const toggleSelection = (id, isChecked) => {
    const newSelection = { ...selectedPotentialMembers };
    if (isChecked) {
      newSelection[id] = "annotator";
    } else {
      delete newSelection[id];
    }
    setSelectedPotentialMembers(newSelection);
  };

  const toggleMemberSelection = (id, isChecked) => {
    const newSelection = new Set(selectedMembers);
    if (isChecked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedMembers(newSelection);
  };

  const handleRoleChange = (id, role) => {
    if (selectedPotentialMembers[id]) {
      setSelectedPotentialMembers({
        ...selectedPotentialMembers,
        [id]: role,
      });
    }
  };

  const allSelected = members.length > 0 && selectedMembers.size === members.length;
  const someSelected = selectedMembers.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map((m) => m.id)));
    }
  };

  return (
    <Modal
      onHide={onClose}
      title={showAddMember ? "Add Members" : "Project Members"}
      style={{ width: 640 }}
      visible
      animate
    >
      <div className={rootClass}>
        {!showAddMember ? (
          <>
            <div className={rootClass.elem("header")}>
              {members.length > 0 && (
                <div className={rootClass.elem("select-all")}>
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={toggleSelectAll}
                  >
                    {selectedMembers.size > 0 ? `${selectedMembers.size} selected` : "Select all"}
                  </Checkbox>
                </div>
              )}
              <div className={rootClass.elem("actions")}>
                {selectedMembers.size > 0 && (
                  <Button onClick={handleDelete} look="danger" size="small" icon={<IconTrash />}>
                    Remove ({selectedMembers.size})
                  </Button>
                )}
                <Button onClick={() => setShowAddMember(true)} look="primary" size="small" icon={<IconUserAdd />}>
                  Add Member
                </Button>
              </div>
            </div>

            <div className={rootClass.elem("list")}>
              {loading ? (
                <div className={rootClass.elem("empty")}>
                  <Spinner />
                </div>
              ) : members.length > 0 ? (
                members.map((member) => (
                  <div key={member.id} className={rootClass.elem("item")}>
                    <div className={rootClass.elem("item-left")}>
                      <Checkbox
                        checked={selectedMembers.has(member.id)}
                        onChange={(e) => toggleMemberSelection(member.id, e.target.checked)}
                      />
                      <Userpic user={member.user} size={32} showUsernameTooltip />
                      <div className={rootClass.elem("details")}>
                        <span className={rootClass.elem("email")}>{member.user.email}</span>
                        <span className={rootClass.elem("name")}>
                          {member.user.first_name} {member.user.last_name}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(member.role || []).map((r) => (
                        <Badge key={r.id} variant={ROLE_BADGE_VARIANT[r.role_name] ?? "outline"} shape="rounded">
                          {ROLES[r.role_name] || r.role_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className={rootClass.elem("empty")}>
                  No members in this project yet.
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className={rootClass.elem("search")}>
              <input
                type="text"
                className={rootClass.elem("search-input")}
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className={rootClass.elem("list")}>
              {loading ? (
                <div className={rootClass.elem("empty")}>
                  <Spinner />
                </div>
              ) : filteredPotentialMembers.length > 0 ? (
                filteredPotentialMembers.map((user) => {
                  const isSelected = !!selectedPotentialMembers[user.id];
                  return (
                    <div
                      key={user.id}
                      className={rootClass.elem("item").mod({ selected: isSelected })}
                    >
                      <div className={rootClass.elem("item-left")}>
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => toggleSelection(user.id, e.target.checked)}
                        />
                        <Userpic user={user} size={32} showUsernameTooltip />
                        <div className={rootClass.elem("details")}>
                          <span className={rootClass.elem("email")}>{user.email}</span>
                          <span className={rootClass.elem("name")}>
                            {user.first_name} {user.last_name}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <Select
                          options={ROLE_OPTIONS}
                          value={selectedPotentialMembers[user.id]}
                          onChange={(val) => handleRoleChange(user.id, val)}
                          size="small"
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className={rootClass.elem("empty")}>
                  {searchQuery ? "No matching users found." : "No users available to add."}
                </div>
              )}
            </div>

            <div className={rootClass.elem("footer")}>
              <span className={rootClass.elem("footer-info")}>
                {Object.keys(selectedPotentialMembers).length > 0
                  ? `${Object.keys(selectedPotentialMembers).length} user(s) selected`
                  : "Select users to add"}
              </span>
              <div className={rootClass.elem("footer-actions")}>
                <Button
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedPotentialMembers({});
                  }}
                  size="small"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  look="primary"
                  size="small"
                  disabled={Object.keys(selectedPotentialMembers).length === 0}
                  waiting={saving}
                >
                  Add to Project
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
