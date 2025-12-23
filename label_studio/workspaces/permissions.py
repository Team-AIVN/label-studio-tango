import rules
from rest_framework import permissions
from workspaces.models import WorkSpaceMember


# Rules definition for ViewClassPermission
@rules.predicate
def is_workspace_manager(user, workspace):
    if not user.is_authenticated:
        return False
    # Check if the object is a Workspace instance
    # Sometimes view object checking happens on queryset or other objects
    if not hasattr(workspace, 'members'):
        return False
        
    return WorkSpaceMember.objects.filter(
        member=user, 
        workspace=workspace, 
        is_workspace_manager=True
    ).exists()

@rules.predicate
def is_workspace_member(user, workspace):
    if not user.is_authenticated:
        return False
    if not hasattr(workspace, 'members'):
        return False

    return WorkSpaceMember.objects.filter(
        member=user, 
        workspace=workspace
    ).exists()

# Register permissions
if rules.perm_exists('workspaces.view'):
    rules.remove_perm('workspaces.view')
rules.add_perm('workspaces.view', is_workspace_member)

if rules.perm_exists('workspaces.change'):
    rules.remove_perm('workspaces.change')
rules.add_perm('workspaces.change', is_workspace_manager)

if rules.perm_exists('workspaces.delete'):
    rules.remove_perm('workspaces.delete')
rules.add_perm('workspaces.delete', is_workspace_manager)

rules.add_perm('workspaces.create', rules.is_authenticated)