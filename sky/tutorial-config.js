// 教程配置文件
// 在这里编辑教程内容，包括文字和图片

const tutorialConfig = {
    title: "使用教程",
    
    steps: [
        {
            number: 1,
            title: "获取二维码-1",
            content: "在游戏中，前往 <strong>设置 > 更多 ",
            image: "images/step1.png", // 填入图片路径，例如：images/step1.png
            note: ""
        },
          {
            number: 2,
            title: "获取二维码-2",
            content: "向下拉，找到线下活动外观二维码",
            image: "images/step2.png", // 填入图片路径，例如：images/step1.png
            note: ""
        }, 
        {
            number: 3,
            title: "上传或输入",
            content: "您可以直接<strong>上传截图</strong>，或使用扫码工具读取截图，得到以 <code>https://sky.thatg.co/o=</code> 开头的网址后，<strong>复制整个网址</strong>并贴到输入框。",
            image: "", // 填入图片路径
            note: "" // 可选，不需要注意事项可留空
        },
        {
            number: 4,
            title: "查看结果",
            content: "点击「开始计算」按钮，系统会自动识别并计算出您的当前身高、最高身高和最低身高。",
            image: "", // 填入图片路径
            note: ""
        },
        {
            number: 5,
            title: "历史记录",
            content: "所有计算结果会自动储存到历史记录中，点击「历史记录」按钮可查看所有记录，还可以查看身高变化趋势图。",
            image: "", // 填入图片路径
            note: ""
        },
        {
            number: 6,
            title: "部分问题",
            content: "由于解码问题，有时并不能获得完整的height值和scale值，导致计算结果会有点数据偏移。该工具仅供参考，该工具纯前端运行，不会上传任何数据，请放心使用。",
            image: "", // 填入图片路径
            note: ""
        }
    ]
};

// 渲染教程内容
function renderTutorial() {
    const tutorialBody = document.querySelector('.tutorial-body');
    if (!tutorialBody) return;

    // 清空现有内容
    tutorialBody.innerHTML = '';

    // 更新标题
    const tutorialTitle = document.querySelector('.tutorial-header h2');
    if (tutorialTitle) {
        tutorialTitle.textContent = tutorialConfig.title;
    }

    // 渲染每个步骤
    tutorialConfig.steps.forEach(step => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'tutorial-step';

        // 步骤编号
        const stepNumber = document.createElement('div');
        stepNumber.className = 'step-number';
        stepNumber.textContent = step.number;

        // 步骤内容
        const stepContent = document.createElement('div');
        stepContent.className = 'step-content';

        // 标题
        const stepTitle = document.createElement('h3');
        stepTitle.textContent = step.title;
        stepContent.appendChild(stepTitle);

        // 内容
        const stepText = document.createElement('p');
        stepText.innerHTML = step.content;
        stepContent.appendChild(stepText);

        // 图片（如果有）
        if (step.image) {
            const stepImage = document.createElement('div');
            stepImage.className = 'step-image';
            const img = document.createElement('img');
            img.src = step.image;
            img.alt = step.title;
            img.onerror = function() {
                stepImage.innerHTML = '<span style="color: var(--error-color);">图片加载失败</span>';
            };
            stepImage.appendChild(img);
            stepContent.appendChild(stepImage);
        }

        // 注意事项（如果有）
        if (step.note) {
            const stepNote = document.createElement('div');
            stepNote.className = 'step-note';
            stepNote.innerHTML = step.note;
            stepContent.appendChild(stepNote);
        }

        stepDiv.appendChild(stepNumber);
        stepDiv.appendChild(stepContent);
        tutorialBody.appendChild(stepDiv);
    });
}

// 在页面加载完成后渲染教程
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderTutorial);
} else {
    renderTutorial();
}
