import { App, Vault, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Workspace, TFile, FileSystemAdapter } from 'obsidian';
import { stripMD } from "obsidian-community-lib";
import { cwd } from 'process';
const path = require('path');
// copyfile.js - копирование файлов 
const fs = require('fs');


// Remember to rename these classes and interfaces!

interface PluginSettings {
	export_path_setting: string;
}

const DEFAULT_SETTINGS: PluginSettings = {
	export_path_setting: "\\\\obsidian\\obsidian\\Лаборатория мультиомиксных исследований\\PEPTIDE_AND_OLIGOSYNTHESIS_GROUP\\OLEG_FEDOROV"
}


export function getAlternativeFilePath(file: TFile): string {
	const dir = file.parent?.path;
	const formattedDir = dir === "/" ? "" : dir;
	const name = file.name;
	for (let index = 1; index < 100; index++) {
		const base = stripMD(name);
		const alternative =
			formattedDir +
			(formattedDir == "" ? "" : "/") +
			base;

		return alternative;
		// }
	}
};

export function write_data(fileName: string | undefined, file_obj: TFile | null, basePath: string, export_dir: string, attachment_paths) {

	if (fileName !== undefined && file_obj !== null) {

		const filepath = getAlternativeFilePath(file_obj);
		// console.log(require('path').resolve(export_dir, '..') + '\\' + filepath + '.md')

		let from_path = basePath + path.sep + filepath + '.md'
		let to_path = export_dir + path.sep + filepath + '.md'

		// destination will be created or overwritten by default.
		fs.copyFile(from_path, to_path, (err) => {
			if (err) throw err;
			// console.log('File was copied to destination');
		});

		for (let from_path of attachment_paths) {
			let to_path = export_dir + path.sep + "attachments" + path.sep + from_path.split(path.sep).slice(-1)[0]
			fs.copyFile(from_path, to_path, (err) => {
				if (err) throw err;
				// console.log('File was copied to destination');
			});
		}
	}

}


export function export_note(route: string, export_path_setting: string) {
	// console.log(editor.getSelection());

	vault: Vault;
	const vaultName = app.vault.getName();
	workspace: Workspace;
	let basePath;
	let nested_directory;
	let export_dir;


	basePath = (
		app.vault.adapter as FileSystemAdapter
	).getBasePath();
	// console.log(basePath)

	nested_directory = require('path').resolve(basePath, '..') + path.sep + "exported" + path.sep + "attachments";
	// export_dir = nested_directory

	export_dir = require('path').resolve(nested_directory, '..');
	// console.log(export_dir)

	const fileName = app.workspace.getActiveFile()?.basename;
	const file_obj = app.workspace.getActiveFile();
	// console.log(fileName);

	const notes_array = [];

	let markdown_files_list = app.vault.getMarkdownFiles()

	for (let md_file of markdown_files_list) {
		let basename = md_file.basename;
		notes_array.push(basename);
	}

	// console.log(notes_array);

	const attachment_paths = [];

	// let note = view.file;
	let notePath;
	if (file_obj != null) {
		notePath = file_obj.path 
	}
	let embeds = this.app.metadataCache.getCache(notePath)?.embeds;
	let links = this.app.metadataCache.getCache(notePath)?.links;
	// console.log(links)
	// links in format -- are not parsed - why?
	// [Formalin-Fixative.pdf](app://obsidian.md/Formalin-Fixative.pdf)  
	if (links) {
		for (let l of links) {

			if (!notes_array.includes(l.link)) {
				let attachment_path = basePath + path.sep + 'attachments' + path.sep + l.link
				attachment_paths.push(attachment_path)
			}

		}
	};

	if (embeds) {
		for (let embed of embeds) {
			let link = embed.link;
			let attachment_path = basePath + path.sep + 'attachments' + path.sep + link
			attachment_paths.push(attachment_path)
		}
	};


	if (route != "..") {

		// plugin: MyPlugin;

		
		// "/mnt/sdb1/coding/test_vault/test_vault"
		// "\\\\obsidian\\obsidian\\Лаборатория мультиомиксных исследований\\PEPTIDE_AND_OLIGOSYNTHESIS_GROUP\\OLEG_FEDOROV"
		nested_directory = export_path_setting + path.sep + "attachments";
		export_dir = require('path').resolve(nested_directory, '..');
	}

	console.log(export_path_setting, basePath, export_dir, attachment_paths)

	// https://stackoverflow.com/questions/30400603/when-working-with-nodejs-fs-mkdir-what-is-the-importance-of-including-callbacks
	if (!fs.existsSync(nested_directory)) {
		fs.mkdir(nested_directory, { recursive: true }, (error) => {
			error ? console.log(error) : console.log('You have created the exported\\attachments dir');
			write_data(fileName, file_obj, basePath, export_dir, attachment_paths)
		})
	} else {
		write_data(fileName, file_obj, basePath, export_dir, attachment_paths)
	}

	// new NotificationModal(this.app).open();
	new Notice('запись + вложения скопированы в директорию ../exported');

}


export default class MyPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('atom', 'Export-Note-Plugin', (evt: MouseEvent) => {

			// let basePath;
			// let nested_directory;
			// let export_dir;
		
			// basePath = (
			// 	app.vault.adapter as FileSystemAdapter
			// ).getBasePath();
	

			// nested_directory = require('path').resolve(basePath, '..') + path.sep + "exported" + path.sep + "attachments";
			// export_dir = nested_directory
			// console.log(export_dir)

			const export_path_setting = this.settings.export_path_setting
			// console.log(export_path_setting)
			
			const route = ''
			export_note(route, export_path_setting)

			// Called when the user clicks the icon.
			// const editor = new Editor;
			// const view = new MarkdownView;
			// const route = "";
			new Notice('This is a notice! check if all was exported correctly.');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('experimental pugin to export notes is ON');

		// This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'export-file-editor-command',
			name: 'Export file editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const route = ".."
				
				export_note(route)
			}
		});


		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class NotificationModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Эта запись была экспортирована со своими вложениями в директорию ../exported');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for export-note plugin.' });

		new Setting(containerEl)
			.setName('export directory path (for example to other labjournal)')
			.setDesc('path')
			.addText(text => text
				.setPlaceholder('Enter desired export path')
				.setValue(this.plugin.settings.export_path_setting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.export_path_setting = value;
					await this.plugin.saveSettings();
				}));
	}
}