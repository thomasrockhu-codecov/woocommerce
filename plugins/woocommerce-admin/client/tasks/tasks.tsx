/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup, MenuItem } from '@wordpress/components';
import { check } from '@wordpress/icons';
import { Fragment, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { ONBOARDING_STORE_NAME, OPTIONS_STORE_NAME } from '@woocommerce/data';
import { useExperiment } from '@woocommerce/explat';
import { recordEvent } from '@woocommerce/tracks';

/**
 * Internal dependencies
 */
import { DisplayOption } from '~/activity-panel/display-options';
import { Task } from './task';
import { TasksPlaceholder, TasksPlaceholderProps } from './placeholder';
import './tasks.scss';
import { TaskListProps, TaskList } from './task-list';
import { TaskList as TwoColumnTaskList } from '../two-column-tasks/task-list';
import { SectionedTaskList } from '../two-column-tasks/sectioned-task-list';
import TwoColumnTaskListPlaceholder from '../two-column-tasks/placeholder';
import '../two-column-tasks/style.scss';
import { getAdminSetting } from '~/utils/admin-settings';
import { SectionedTaskListPlaceholder } from '~/two-column-tasks/sectioned-task-list-placeholder';

export type TasksProps = {
	query: { task?: string };
};

function getTaskListComponent( taskListId: string ): React.FC< TaskListProps > {
	switch ( taskListId ) {
		case 'setup_experiment_1':
			return TwoColumnTaskList;
		case 'setup_experiment_2':
			return SectionedTaskList;
		default:
			return TaskList;
	}
}

function getTaskListPlaceholderComponent(
	taskListId: string
): React.FC< TasksPlaceholderProps > {
	switch ( taskListId ) {
		case 'setup_experiment_1':
			return TwoColumnTaskListPlaceholder;
		case 'setup_experiment_2':
			return SectionedTaskListPlaceholder;
		default:
			return TasksPlaceholder;
	}
}

export const Tasks: React.FC< TasksProps > = ( { query } ) => {
	const { task } = query;
	const { hideTaskList } = useDispatch( ONBOARDING_STORE_NAME );
	const { updateOptions } = useDispatch( OPTIONS_STORE_NAME );
	const [ isLoadingExperiment, experimentAssignment ] = useExperiment(
		'woocommerce_tasklist_progression'
	);

	const { isResolving, taskLists } = useSelect( ( select ) => {
		return {
			isResolving: ! select(
				ONBOARDING_STORE_NAME
			).hasFinishedResolution( 'getTaskLists' ),
			taskLists: select( ONBOARDING_STORE_NAME ).getTaskLists(),
		};
	} );

	const getCurrentTask = () => {
		if ( ! task ) {
			return null;
		}

		const tasks = taskLists.reduce(
			( acc, taskList ) => [ ...acc, ...taskList.tasks ],
			[]
		);

		const currentTask = tasks.find( ( t ) => t.id === task );

		if ( ! currentTask ) {
			return null;
		}

		return currentTask;
	};

	const toggleTaskList = ( taskList ) => {
		const { id, eventPrefix, isHidden } = taskList;
		const newValue = ! isHidden;

		recordEvent(
			newValue ? `${ eventPrefix }hide` : `${ eventPrefix }show`,
			{}
		);

		hideTaskList( id );
	};

	useEffect( () => {
		// @todo Update this when all task lists have been hidden or completed.
		const taskListsFinished = false;
		updateOptions( {
			woocommerce_task_list_prompt_shown: true,
		} );
	}, [ taskLists, isResolving ] );

	const currentTask = getCurrentTask();

	if ( task && ! currentTask ) {
		return null;
	}

	const taskListIds = getAdminSetting( 'visibleTaskListIds', [] );
	const TaskListPlaceholderComponent = getTaskListPlaceholderComponent(
		taskListIds[ 0 ]
	);

	if ( isResolving ) {
		return <TaskListPlaceholderComponent query={ query } />;
	}

	if ( currentTask ) {
		return (
			<div className="woocommerce-task-dashboard__container">
				<Task query={ query } task={ currentTask } />
			</div>
		);
	}

	if ( isLoadingExperiment ) {
		return <TaskListPlaceholderComponent query={ query } />;
	}

	return taskLists
		.filter( ( { id } ) =>
			experimentAssignment?.variationName === 'treatment'
				? id.endsWith( 'two_column' )
				: ! id.endsWith( 'two_column' )
		)
		.map( ( taskList ) => {
			const { id, isHidden, isVisible, isToggleable } = taskList;

			if ( ! isVisible ) {
				return null;
			}

			const TaskListComponent = getTaskListComponent( id );

			return (
				<Fragment key={ id }>
					<TaskListComponent
						isExpandable={
							experimentAssignment?.variationName === 'treatment'
						}
						query={ query }
						twoColumns={ false }
						{ ...taskList }
					/>
					{ isToggleable && (
						<DisplayOption>
							<MenuGroup
								className="woocommerce-layout__homescreen-display-options"
								label={ __( 'Display', 'woocommerce' ) }
							>
								<MenuItem
									className="woocommerce-layout__homescreen-extension-tasklist-toggle"
									icon={ ! isHidden && check }
									isSelected={ ! isHidden }
									role="menuitemcheckbox"
									onClick={ () => toggleTaskList( taskList ) }
								>
									{ __(
										'Show things to do next',
										'woocommerce'
									) }
								</MenuItem>
							</MenuGroup>
						</DisplayOption>
					) }
				</Fragment>
			);
		} );
};
