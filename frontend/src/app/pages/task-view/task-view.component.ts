import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { List } from 'src/app/models/list.model';
import { Task } from 'src/app/models/task.model';
import { TaskService } from 'src/app/services/task.service';

@Component({
  selector: 'app-task-view',
  templateUrl: './task-view.component.html',
  styleUrls: ['./task-view.component.scss'],
})
export class TaskViewComponent implements OnInit {
  lists!: List[];
  tasks!: Task[];

  selectedListId!: string;

  constructor(
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      if (params?.['listId']) {
        this.selectedListId = params?.['listId'];
        this.taskService
          .getTasks(params?.['listId'])
          .subscribe((tasks: any) => {
            this.tasks = tasks;
          });
      } else {
        this.tasks = undefined!;
      }
    });

    this.taskService.getLists().subscribe((lists: any) => {
      this.lists = lists;
    });
  }

  onTaskClick(task: Task) {
    // we want to set the task to completed
    this.taskService.complete(task).subscribe(() => {
      // the task has been set to completed successully
      console.log('Completed successfully!');
      task.completed = !task.completed;
    });
  }

  onTaskEditClick() {}

  onDeleteTaskClick(id: string) {
    this.taskService
      .deleteTask(this.selectedListId, id)
      .subscribe((response: any) => {
        this.tasks = this.tasks.filter((value) => value._id !== id);
        console.log(response);
      });
  }

  onDeleteListClick() {
    this.taskService
      .deleteList(this.selectedListId)
      .subscribe((response: any) => {
        this.router.navigate(['/lists']);
        console.log(response);
      });
  }
}
