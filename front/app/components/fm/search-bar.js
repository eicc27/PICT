import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class FmSearchBarComponent extends Component {
    @tracked showFilter = false;
    @tracked showHint = true;
    @tracked searchType = [0, 0];
    @tracked filterType = [3, 0];
    @tracked sortType = [0, 0];
    @tracked sortBy = [1, 0];

    SEARCH_TYPES = {
        title: '搜索类型',
        options: [
            {
                icon: 'svg/lens-blur',
                items: [
                    {
                        title: '模糊',
                        value: 'amb',
                        focus: true,
                    },
                ],
            },
            {
                icon: 'svg/point-scan',
                items: [
                    {
                        title: '精确',
                        value: 'acc',
                        focus: false,
                    },
                ],
            },
        ],
    };

    FILTER_TYPES = {
        title: '分类',
        options: [
            {
                icon: 'svg/person',
                items: [
                    { title: '画师名', value: 'name', focus: false },
                    { title: '用户ID', value: 'uid', focus: false },
                ],
            },
            {
                icon: 'svg/image',
                items: [
                    { title: '作品标题', value: 'title', focus: false },
                    { title: '作品ID', value: 'pid', focus: false },
                ],
            },
            {
                icon: 'svg/tags',
                items: [
                    { title: '标签', value: 'tag', focus: false },
                ],
            },
            {
                icon: 'svg/close',
                items: [
                    { title: '不限', value: 'all', focus: true },
                ],
            }
        ],
    };

    SORT_TYPES = {
        title: '排序',
        options: [
            {
                icon: 'svg/time',
                items: [
                    {title: '时间', value: 'time'},
                ]
            },
            {
                icon: 'svg/cursor',
                items: [
                    {title: '本地访问量', value: 'views'},
                ]
            },
        ]
    }

    SORT_BY = {
        title: '顺序',
        options: [
            {
                icon: 'svg/trending-up',
                items: [
                    {title: '升序', value: 'asc'},
                ]
            },
            {
                icon: 'svg/trending-down',
                items: [
                    {title: '降序', value: 'desc'},
                ]
            }
        ]
    }

    @action toggleHint() {
        const inputElement = document.querySelector('.searchbar input');
        const hintElement = document.querySelector('.searchbar .hint');
        if (!inputElement.value.length) {
            hintElement.style.display = 'flex';
        } else {
            hintElement.style.display = 'none';
        }
    }

    @action toggleFilter() {
        this.showFilter = !this.showFilter;
    }

    @action setParam(param, target) {
        switch (target) {
            case 'searchType':
                this.searchType = param;
                break;
            case 'filterType':
                this.filterType = param;
                break;
            case 'sortType':
                this.sortType = param;
                break;
            case 'sortBy':
                this.sortBy = param;
                break;
            default:
                break;
        }
    }
}
