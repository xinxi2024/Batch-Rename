class FileRenamer {
    constructor() {
        this.files = [];
        this.zip = new JSZip();
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.prefixOptions = document.getElementById('prefix-options');
        this.replaceOptions = document.getElementById('replace-options');
        this.numberOptions = document.getElementById('number-options');
        this.extensionOptions = document.getElementById('extension-options');
        this.previewList = document.getElementById('preview-list');
        this.applyBtn = document.getElementById('apply-btn');
    }

    setupEventListeners() {
        // 拖放事件
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragover');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });

        // 文件输入事件
        this.fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
        });

        // 应用更改事件
        this.applyBtn.addEventListener('click', () => this.applyChanges());

        // 实时预览更新
        const optionInputs = document.querySelectorAll('#prefix-options input, #replace-options input, #number-options input, #extension-options input');
        optionInputs.forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });
    }

    handleFiles(files) {
        this.files = files;
        this.updatePreview();
    }
    getNewFileName(file, index) {
        let fileName = file.name;
        const extension = fileName.includes('.') ? 
            fileName.substring(fileName.lastIndexOf('.')) : '';
        const nameWithoutExt = fileName.substring(0, fileName.length - extension.length);
        
        // 应用前缀
        const prefix = document.getElementById('prefix-text').value;
        if (prefix) {
            fileName = `${prefix}${fileName}`;
        }
        
        // 应用替换
        const oldText = document.getElementById('old-text').value;
        const newText = document.getElementById('new-text').value;
        if (oldText) {
            fileName = fileName.replace(new RegExp(oldText, 'g'), newText);
        }
        
        // 应用编号
        const enableNumbering = document.getElementById('enable-numbering').checked;
        const startNum = parseInt(document.getElementById('start-number').value);
        const digits = parseInt(document.getElementById('digit-count').value);
        if (enableNumbering && !isNaN(startNum) && !isNaN(digits)) {
            const number = (startNum + index).toString().padStart(digits, '0');
            fileName = `${number}_${fileName}`;
        }
        
        // 应用后缀修改
        const newExtension = document.getElementById('new-extension').value.trim();
        if (newExtension) {
            // 确保新后缀不包含前导点
            const cleanExtension = newExtension.replace(/^\./g, '');
            // 从当前文件名中提取不含后缀的部分
            const currentNameWithoutExt = fileName.includes('.') ? 
                fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
            fileName = `${currentNameWithoutExt}.${cleanExtension}`;
        }
        
        return fileName;
    }

    updatePreview() {
        this.previewList.innerHTML = '';
        this.files.forEach((file, index) => {
            const newName = this.getNewFileName(file, index);
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <span>${file.name}</span>
                <span>→</span>
                <span>${newName}</span>
            `;
            this.previewList.appendChild(previewItem);
        });
    }

    async applyChanges() {
        if (this.files.length === 0) {
            alert('请先选择文件！');
            return;
        }

        this.zip = new JSZip();
        const promises = this.files.map((file, index) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newName = this.getNewFileName(file, index);
                    this.zip.file(newName, e.target.result);
                    resolve();
                };
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });
        });

        try {
            await Promise.all(promises);
            const content = await this.zip.generateAsync({type: 'blob'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'renamed_files.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('文件处理过程中出现错误：', error);
            alert('文件处理过程中出现错误，请重试！');
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new FileRenamer();
});