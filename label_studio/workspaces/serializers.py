from rest_framework import serializers
from workspaces.models import WorkSpace, WorkSpaceMember


class WorkSpaceSerializer(serializers.ModelSerializer):

    class Meta:
        model = WorkSpace
        fields = ['id', 'title']








