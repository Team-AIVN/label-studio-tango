from rest_framework import permissions

from workspaces.models import WorkSpaceMember


class WorkSpaceOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        member = WorkSpaceMember.objects.get(member=request.user, workspace=obj)

        return member.is_owner


class WorkSpaceMember((permissions.BasePermission)):
    def has_object_permission(self, request, view, obj):
        return WorkSpaceMember.objects.filter(member=request.user, workspace=obj).exists()
