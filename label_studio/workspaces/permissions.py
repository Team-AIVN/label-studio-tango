from rest_framework import permissions
from workspaces.models import WorkSpaceMember


class WorkSpaceManagerPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return WorkSpaceMember.objects.filter(member=request.user, workspace=obj, is_workspace_manager=True).exists()


class WorkSpaceMemberPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return WorkSpaceMember.objects.filter(member=request.user, workspace=obj).exists()
