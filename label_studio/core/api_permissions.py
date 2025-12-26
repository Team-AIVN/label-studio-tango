from rest_framework import permissions
import rules
from rest_framework.permissions import BasePermission, SAFE_METHODS


class HasViewClassPermission(permissions.BasePermission):
    """
    This permission class reads the `permission_required` attribute on a view
    and checks it against the `django-rules` backend.

    The `permission_required` attribute must be an instance of `ViewClassPermission`
    mapping HTTP methods to permission names.
    
    Example:
        class MyView(APIView):
            permission_required = ViewClassPermission(
                GET='my_app.view_thing',
                POST='my_app.add_thing'
            )
    """

    def has_permission(self, request, view):
        # Get the required permission from the view's permission_required attribute
        required_perm = getattr(view, 'permission_required', None)

        # If no permission is required, deny access for safety.
        # You could change this to `return True` if you want permissive access by default.
        if not required_perm:
            return False

        # Get the permission name for the current request method
        perm_name = getattr(required_perm, request.method, None)

        # If a permission is specified for this method, check it
        if perm_name:
            # Check permission without object first
            has_perm_without_obj = request.user.has_perm(perm_name)
            
            # If permission check without object returns False, it means this permission
            # requires an object. In that case, we allow at class level (basic auth check)
            # and rely on has_object_permission for the actual authorization.
            # This prevents the predicate from having to handle None objects.
            if not has_perm_without_obj:
                # Object-level permission is required - allow at class level,
                # actual check will happen in has_object_permission
                return request.user.is_authenticated
            
            return has_perm_without_obj

        # If no permission is specified for this method, deny access.
        return False

    def has_object_permission(self, request, view, obj):
        # Get the required permission from the view's permission_required attribute
        required_perm = getattr(view, 'permission_required', None)

        # If no permission is required, deny access.
        if not required_perm:
            return False

        # Get the permission name for the current request method
        perm_name = getattr(required_perm, request.method, None)

        # If a permission is specified for this method, check it against the object
        if perm_name:
            return request.user.has_perm(perm_name, obj)

        # If no permission is specified for this method, deny access.
        return False


class HasObjectPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.has_permission(request.user)


class MemberHasOwnerPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method not in SAFE_METHODS and not request.user.own_organization:
            return False

        return obj.has_permission(request.user)

