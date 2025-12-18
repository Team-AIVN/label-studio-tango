from botocore.parsers import JSONParser
from rest_framework import generics
from rest_framework.parsers import FormParser

from workspaces.models import WorkSpaceMember, WorkSpace
from workspaces.permissions import WorkSpaceOwner
from workspaces.serializers import WorkSpaceSerializer


class WorkSpaceListAPI(generics.ListCreateAPIView):
    serializer_class = WorkSpaceSerializer
    parser_classes = [JSONParser, FormParser]

    def get_queryset(self):
        return self.request.user.workspaces.all()

    def perform_create(self, serializer):
        workspace = serializer.save()
        WorkSpaceMember.objects.create(workspace=workspace, member=self.request.user, is_owner=True)


class WorkSpaceAPI(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WorkSpaceSerializer
    parser_classes = [JSONParser, FormParser]
    permission_classes = [WorkSpaceOwner]
    queryset = WorkSpace.objects.all()



