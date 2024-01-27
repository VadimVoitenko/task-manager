import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
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

  selectedListId?: string;

  constructor(
    private taskService: TaskService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    // this.route.params.subscribe((params: Params) => {
    //   console.log(params);
    //   console.log('22 string');
    //   this.taskService
    //     .getTasks(params?.['listId'])
    //     .subscribe((tasks: Object) => {
    //       this.tasks = tasks;
    //       console.log('27 string');
    //     });
    // });
    // this.taskService.getLists().subscribe((lists: Object) => {
    //   console.log('32 string');
    //   this.lists = lists;
    // });
    this.route.params.subscribe((params: Params) => {
      if (params?.['listId']) {
        this.selectedListId = params?.['listId'];
        this.taskService
          .getTasks(params?.['listId'])
          .subscribe((tasks: any) => {
            this.tasks = tasks;
          });
      } else {
        this.tasks == undefined;
      }
    });

    this.taskService.getLists().subscribe((lists: any) => {
      this.lists = lists;
    });
  }

  // createNewList() {
  //   this.taskService.createList('Testing').subscribe((response: any) => {
  //     console.log(response);
  //   });
  // }
}
