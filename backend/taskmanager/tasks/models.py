from django.db import models
from django.contrib.auth.models import User # Import User

class Task(models.Model):
    # These match the columns in your future Kanban board
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at'] # Sorts newest items to the top