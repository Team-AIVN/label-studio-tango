import rules
from rules import predicate

from core.permissions import make_perm
from workspaces.models import WorkSpaceMember

# Predicates
@rules.predicate
def is_workspace_manager(user, workspace=None):
    """
    Check if user is a workspace manager.
    This predicate requires a workspace object. If workspace is None,
    returns False (object-level check is required).
    """
    if not user or not user.is_authenticated:
        return False
    
    # This permission requires a workspace object for proper authorization
    if workspace is None:
        return False
        
    if not hasattr(workspace, 'members'):
        return False
        
    return WorkSpaceMember.objects.filter(
        member=user, 
        workspace=workspace, 
        is_workspace_manager=True
    ).exists()

@rules.predicate
def is_workspace_member(user, workspace=None):
    """
    Check if user is a workspace member.
    This predicate requires a workspace object. If workspace is None,
    returns False (object-level check is required).
    """
    if not user or not user.is_authenticated:
        return False
    
    # This permission requires a workspace object for proper authorization
    if workspace is None:
        return False

    if not hasattr(workspace, 'members'):
        return False

    return WorkSpaceMember.objects.filter(
        member=user, 
        workspace=workspace
    ).exists()

# Register and overwrite permissions using set_perm
make_perm('workspaces.view', is_workspace_member)
make_perm('workspaces.change', is_workspace_manager)
make_perm('workspaces.delete', is_workspace_manager)
make_perm('workspaces.create', rules.is_authenticated)

