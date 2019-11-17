import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { FormatService } from 'src/app/service/format/format.service';
import { LessonService } from 'src/app/service/lesson/lesson.service';
import { ScheduleService } from 'src/app/service/schedule/schedule.service';
// @ts-ignore
import { dayMap, lessonFormatMap, lessonFormats, weekDays } from 'src/core/const/collections';
import { lessonForm } from 'src/core/const/form';

@Component({
    selector: 'app-lesson-editor',
    templateUrl: './lesson-editor.component.html',
    styleUrls: ['./lesson-editor.component.scss'],
})
export class LessonEditorComponent implements OnInit {
    public lessonEntry: string[][];
    public vacantWeeks: VacantWeekInfoInterface[];
    public lessonForm: FormGroup = lessonForm();
    public lessonFormats = lessonFormats();
    public subgroups;
    public lessonsMap: Map<number, LessonFormatInterface> = lessonFormatMap();
    public dayMap: Map<number, string> = dayMap();
    public weekDays: string[] = weekDays();
    public lessonTimes: LessonTimeInterface[] = [];

    private _groupId: number;

    public get groupId(): number {
        return this._groupId;
    }

    public set groupId(value: number) {
        this._groupId = value;
        this._getSubgroupList();
    }

    private _lesson: LessonInterface;

    public get lesson(): LessonInterface {
        return this._lesson;
    }

    public set lesson(value: LessonInterface) {
        this._lesson = value;
        if (value) {
            this.lessonForm.patchValue({...value});
            this.lessonEntry = Object.entries(value);
            this._initVacantWeeksList();
        }
    }

    private _groupSchedule: TimetableInterface;

    private get groupSchedule(): TimetableInterface {
        return this._groupSchedule;
    }

    private set groupSchedule(value: TimetableInterface) {
        this._groupSchedule = value;
        if (value) {
            this.groupId = value.info.group.id;
            [this.lessonTimes, this.weekSchedule] = this.formatService.initSchedule(value);
        }
    }

    private _weekSchedule: LessonInterface[][][];

    private get weekSchedule(): LessonInterface[][][] {
        return this._weekSchedule;
    }

    private set weekSchedule(value: LessonInterface[][][]) {
        this._weekSchedule = value;
        this._initVacantWeeksList();
    }

    constructor(private router: Router,
                private route: ActivatedRoute,
                private formatService: FormatService,
                private scheduleService: ScheduleService,
                private lessonService: LessonService) { }

    ngOnInit() {
        const params = this.route.snapshot.paramMap;

        if (history.state.state) {
            this.groupSchedule = history.state.state.groupSchedule;
        }

        if (params.has('lessonId')) this._getLesson(+params.get('lessonId'));

        if (!this.weekSchedule || !this.lessonTimes)
            this.scheduleService.getTimetable(params.get('groupSlug'))
                .pipe(tap(res => this.groupId = this.groupId || res.info.group.id))
                .subscribe(res => this.groupSchedule = res);
    }

    public loadThemes = (option: LoadPageInterface) => this.scheduleService.getThemes({...option, groupId: this.groupId});

    public loadTheme = (id: number) => this.scheduleService.getTheme(id);

    public loadHousings = (option: LoadPageInterface) => this.scheduleService.getHousings({...option, groupId: this.groupId});

    public loadHousing = (id: number) => this.scheduleService.getHousing(id);

    public loadRooms = (option: LoadPageInterface) => this.scheduleService.getRooms({...option, housingId: this.lessonForm.value.housing});

    public loadRoom = (id: number) => this.scheduleService.getRoom(id);

    public loadTeachers = (option: LoadPageInterface) => this.scheduleService.getTeachers({...option, groupId: this.groupId});

    public loadTeacher = (id: number) => this.scheduleService.getTeacher(id);

    public roomToSting = (room) => room ? room.num : '';

    public getLessonTimeById(id: number): string {
        const lessonTime = this.lessonTimes.find(i => i.id === id);
        return lessonTime ? lessonTime.start + ' - ' + lessonTime.end : '';
    }

    public closeModal() {
        this.router.navigate([{outlets: {modal: null}}]);
    }

    public onLessonTimeOrDayChange() {
      this.lesson.day = this.lessonForm.value.day;
      this.lesson.lesson_time = this.lessonForm.value.lesson_time;
      this._initVacantWeeksList();
    }

    private _getLesson(lessonId: number) {
        this.lessonService.getLesson(lessonId)
            .subscribe(lesson => this.lesson = lesson);
    }

    private _getSubgroupList() {
        this.scheduleService.getGroup(this.groupId)
            .subscribe(group => this.subgroups = new Array(+group.subgroups).fill('').map((_, i) => i + 1));
    }

    private _initVacantWeeksList() {
        if (this.weekSchedule && this.lesson) {
          this.vacantWeeks = this.formatService.getVacantWeeks(this._groupSchedule, this.weekSchedule, this.lessonTimes, this.lesson);
          this.vacantWeeks.forEach(week => week.isUsed = week.isUsed && week.isVacant);
        }
    }
}
