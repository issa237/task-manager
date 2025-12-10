from rest_framework import viewsets, permissions
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated] # Only logged in users

    def get_queryset(self):
        # Only return tasks belonging to the current user
        return Task.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # When creating a task, automatically set the 'user' field
        serializer.save(user=self.request.user)