// متغيرات عامة
let canvas, ctx;
let currentBackground = 'linear-gradient(135deg, #667eea, #764ba2)';
let elements = [];
let history = [];
let currentStep = -1;
let selectedElement = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let selectedElementColor = '#4299e1';
let pendingDeleteElement = null;

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    initializeCanvas();
    setupEventListeners();
    setupCollapsibleSections();
    generateTemplates();
    generateBackgrounds();
    generateElementColorPalette();
    generatePresetMessages();
    drawInitialCard();
});

// تهيئة الكانفاس
function initializeCanvas() {
    canvas = document.getElementById('designCanvas');
    ctx = canvas.getContext('2d');

    // تعيين أبعاد الكانفاس
    canvas.width = 600;
    canvas.height = 400;
}

// إعداد الأقسام القابلة للطي
function setupCollapsibleSections() {
    const sectionHeaders = document.querySelectorAll('.section-header');

    sectionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const content = document.getElementById(targetId);

            // تبديل حالة الطي
            this.classList.toggle('collapsed');
            content.classList.toggle('collapsed');

            // حفظ حالة الأقسام في localStorage
            const sectionStates = JSON.parse(localStorage.getItem('sectionStates') || '{}');
            sectionStates[targetId] = content.classList.contains('collapsed');
            localStorage.setItem('sectionStates', JSON.stringify(sectionStates));
        });
    });

    // استعادة حالة الأقسام المحفوظة
    const savedStates = JSON.parse(localStorage.getItem('sectionStates') || '{}');
    Object.keys(savedStates).forEach(sectionId => {
        if (savedStates[sectionId]) {
            const content = document.getElementById(sectionId);
            const header = document.querySelector(`[data-target="${sectionId}"]`);
            if (content && header) {
                content.classList.add('collapsed');
                header.classList.add('collapsed');
            }
        }
    });
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // النصوص الأساسية والثانوية
    document.getElementById('primaryText').addEventListener('input', updateCard);
    document.getElementById('secondaryText').addEventListener('input', updateCard);
    document.getElementById('primaryFontSize').addEventListener('input', function() {
        document.getElementById('primaryFontSizeValue').textContent = this.value + 'px';
        updateCard();
    });
    document.getElementById('secondaryFontSize').addEventListener('input', function() {
        document.getElementById('secondaryFontSizeValue').textContent = this.value + 'px';
        updateCard();
    });
    document.getElementById('primaryTextColor').addEventListener('change', updateCard);
    document.getElementById('secondaryTextColor').addEventListener('change', updateCard);
    document.getElementById('fontFamily').addEventListener('change', updateCard);

    // التدرج المخصص
    document.getElementById('applyCustomGradient').addEventListener('click', applyCustomGradient);

    // صورة الخلفية
    document.getElementById('backgroundImage').addEventListener('change', handleBackgroundImage);
    document.getElementById('backgroundOpacity').addEventListener('input', function() {
        document.getElementById('backgroundOpacityValue').textContent = Math.round(this.value * 100) + '%';
        updateCard();
    });

    // العناصر التصميمية
    document.querySelectorAll('.element-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            addDesignElement(this.dataset.element);
        });
    });

    // التحكم في ألوان العناصر
    document.getElementById('customElementColor').addEventListener('change', function() {
        selectedElementColor = this.value;
        updateColorPaletteSelection();
        // إذا كان هناك عنصر محدد، قم بتحديث لونه
        if (selectedElement) {
            selectedElement.color = this.value;
            document.getElementById('elementColor').value = this.value;
            updateCard();
            saveState();
        }
    });

    // إضافة مستمع لوحة المفاتيح للحذف
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Delete' && selectedElement) {
            deleteSelectedElementWithConfirm();
        }
        if (event.key === 'Escape') {
            hideElementControls();
            updateCard();
        }
    });

    // التحكم في العناصر
    document.getElementById('elementSize').addEventListener('input', function() {
        document.getElementById('elementSizeValue').textContent = this.value + 'px';
        updateSelectedElement();
    });
    document.getElementById('elementOpacity').addEventListener('input', function() {
        document.getElementById('elementOpacityValue').textContent = Math.round(this.value * 100) + '%';
        updateSelectedElement();
    });
    document.getElementById('elementColor').addEventListener('change', updateSelectedElement);
    document.getElementById('elementRotation').addEventListener('input', function() {
        document.getElementById('elementRotationValue').textContent = this.value + '°';
        updateSelectedElement();
    });

    // التحكم السريع في الحجم والشفافية للعناصر المحددة
    document.getElementById('quickElementSize').addEventListener('input', function() {
        document.getElementById('quickElementSizeValue').textContent = this.value + 'px';
        updateSelectedElementQuick();
    });
    document.getElementById('quickElementOpacity').addEventListener('input', function() {
        document.getElementById('quickElementOpacityValue').textContent = Math.round(this.value * 100) + '%';
        updateSelectedElementQuick();
    });
    document.getElementById('deleteElement').addEventListener('click', deleteSelectedElement);
    document.getElementById('lockElement').addEventListener('click', toggleElementLock);
    document.getElementById('lockAllElements').addEventListener('click', toggleAllElementsLock);
    document.getElementById('removeBackgroundImage').addEventListener('click', removeBackgroundImage);
    document.getElementById('applyColorToAll').addEventListener('click', applyColorToAllElements);

    // مستمعي الأحداث للصندوق العائم
    document.getElementById('confirmDelete').addEventListener('click', confirmDeleteElement);
    document.getElementById('cancelDelete').addEventListener('click', cancelDeleteElement);

    // مستمعي الأحداث للوحة التحكم العائمة
    document.getElementById('closePanelBtn').addEventListener('click', hideFloatingPanel);
    document.getElementById('floatingElementColor').addEventListener('change', updateFloatingElementColor);
    document.getElementById('floatingElementSize').addEventListener('input', updateFloatingElementSize);
    document.getElementById('floatingElementOpacity').addEventListener('input', updateFloatingElementOpacity);
    document.getElementById('floatingElementRotation').addEventListener('input', updateFloatingElementRotation);
    document.getElementById('floatingDeleteBtn').addEventListener('click', () => showConfirmModal());
    document.getElementById('floatingLockBtn').addEventListener('click', toggleElementLockFromFloating);

    // الأزرار
    document.getElementById('downloadBtn').addEventListener('click', downloadCard);
    document.getElementById('clearBtn').addEventListener('click', clearCanvas);
    document.getElementById('undoBtn').addEventListener('click', undo);

    // الكانفاس للتفاعل
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDoubleClick);
}

// متغيرات إضافية
let backgroundImage = null;
let backgroundOpacity = 1;

// إنشاء القوالب الجاهزة المحسنة
function generateTemplates() {
    const templatesGrid = document.getElementById('templatesGrid');
    const templates = [
        {
            name: 'كلاسيكي ذهبي',
            background: 'linear-gradient(135deg, #f6ad55, #ed8936)',
            primaryText: 'عيد مبارك',
            secondaryText: 'كل عام وأنتم بخير',
            primaryColor: '#ffffff',
            secondaryColor: '#f0f0f0'
        },
        {
            name: 'أزرق أنيق',
            background: 'linear-gradient(135deg, #4299e1, #3182ce)',
            primaryText: 'عيد سعيد',
            secondaryText: 'تقبل الله منا ومنكم',
            primaryColor: '#ffffff',
            secondaryColor: '#e6f3ff'
        },
        {
            name: 'أخضر طبيعي',
            background: 'linear-gradient(135deg, #48bb78, #38a169)',
            primaryText: 'عيد مبارك',
            secondaryText: 'أعاده الله عليكم بالخير',
            primaryColor: '#ffffff',
            secondaryColor: '#e6fffa'
        },
        {
            name: 'بنفسجي ملكي',
            background: 'linear-gradient(135deg, #9f7aea, #805ad5)',
            primaryText: 'عيد فطر مبارك',
            secondaryText: 'كل عام وأنتم بألف خير',
            primaryColor: '#ffffff',
            secondaryColor: '#faf5ff'
        },
        {
            name: 'وردي رومانسي',
            background: 'linear-gradient(135deg, #ed64a6, #d53f8c)',
            primaryText: 'عيد أضحى مبارك',
            secondaryText: 'تقبل الله منا ومنكم',
            primaryColor: '#ffffff',
            secondaryColor: '#fed7e2'
        },
        {
            name: 'برتقالي دافئ',
            background: 'linear-gradient(135deg, #ff7a00, #ff9500)',
            primaryText: 'عيد سعيد',
            secondaryText: 'أسعد الله أيامكم',
            primaryColor: '#ffffff',
            secondaryColor: '#fff5e6'
        },
        {
            name: 'تدرج قوس قزح',
            background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
            primaryText: 'عيد مبارك',
            secondaryText: 'وكل عام وأنتم بصحة وسعادة',
            primaryColor: '#ffffff',
            secondaryColor: '#f0f0f0'
        },
        {
            name: 'أحمر كلاسيكي',
            background: 'linear-gradient(135deg, #e53e3e, #c53030)',
            primaryText: 'تهانينا بالعيد',
            secondaryText: 'عيد مبارك وسعيد',
            primaryColor: '#ffffff',
            secondaryColor: '#fed7d7'
        },
        {
            name: 'تركوازي هادئ',
            background: 'linear-gradient(135deg, #38b2ac, #319795)',
            primaryText: 'عيد فطر سعيد',
            secondaryText: 'كل عام وأنتم بخير وسلام',
            primaryColor: '#ffffff',
            secondaryColor: '#e6fffa'
        },
        {
            name: 'ذهبي فاخر',
            background: 'linear-gradient(135deg, #d69e2e, #b7791f)',
            primaryText: 'عيد مبارك',
            secondaryText: 'أعاده الله عليكم باليمن والبركات',
            primaryColor: '#ffffff',
            secondaryColor: '#faf089'
        }
    ];

    templates.forEach((template, index) => {
        const templateDiv = document.createElement('div');
        templateDiv.className = 'template-item';
        templateDiv.style.background = template.background;
        templateDiv.innerHTML = `<div style="padding: 8px; color: white; font-size: 9px; text-align: center; font-weight: bold;">${template.name}</div>`;
        templateDiv.addEventListener('click', () => applyTemplate(template));
        templatesGrid.appendChild(templateDiv);
    });
}

// إنشاء لوحة ألوان العناصر
function generateElementColorPalette() {
    const colorPalette = document.getElementById('elementColorPalette');
    const colors = [
        '#4299e1', // أزرق
        '#48bb78', // أخضر
        '#ed8936', // برتقالي
        '#9f7aea', // بنفسجي
        '#ed64a6', // وردي
        '#38b2ac', // تركوازي
        '#ecc94b', // أصفر
        '#e53e3e', // أحمر
        '#2d3748', // رمادي داكن
        '#718096', // رمادي
        '#ffffff', // أبيض
        '#000000'  // أسود
    ];

    colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        if (color === selectedElementColor) {
            colorOption.classList.add('active');
        }
        colorOption.addEventListener('click', () => {
            selectedElementColor = color;
            document.getElementById('customElementColor').value = color;
            updateColorPaletteSelection();

            // إذا كان هناك عنصر محدد، قم بتحديث لونه فوراً
            if (selectedElement) {
                selectedElement.color = color;
                document.getElementById('elementColor').value = color;
                updateCard();
                saveState();
            }
        });
        colorPalette.appendChild(colorOption);
    });
}

// تحديث تحديد لوحة الألوان
function updateColorPaletteSelection() {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('active');
        if (option.style.backgroundColor === selectedElementColor ||
            rgbToHex(option.style.backgroundColor) === selectedElementColor) {
            option.classList.add('active');
        }
    });
}

// تحويل RGB إلى HEX
function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const result = rgb.match(/\d+/g);
    if (!result) return rgb;
    return '#' + result.map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// إنشاء خيارات الخلفيات
function generateBackgrounds() {
    const gradientOptions = document.getElementById('gradientOptions');
    const solidColors = document.getElementById('solidColors');
    
    // التدرجات
    const gradients = [
        'linear-gradient(135deg, #667eea, #764ba2)',
        'linear-gradient(135deg, #f6ad55, #ed8936)',
        'linear-gradient(135deg, #4299e1, #3182ce)',
        'linear-gradient(135deg, #48bb78, #38a169)',
        'linear-gradient(135deg, #9f7aea, #805ad5)',
        'linear-gradient(135deg, #ed64a6, #d53f8c)',
        'linear-gradient(135deg, #38b2ac, #319795)',
        'linear-gradient(135deg, #ecc94b, #d69e2e)'
    ];
    
    gradients.forEach(gradient => {
        const option = document.createElement('div');
        option.className = 'bg-option';
        option.style.background = gradient;
        option.addEventListener('click', () => setBackground(gradient));
        gradientOptions.appendChild(option);
    });
    
    // الألوان الصلبة
    const colors = ['#2d3748', '#1a202c', '#2c5282', '#2f855a', '#744210', '#97266d', '#2c7a7b', '#d69e2e'];
    
    colors.forEach(color => {
        const option = document.createElement('div');
        option.className = 'bg-option';
        option.style.background = color;
        option.addEventListener('click', () => setBackground(color));
        solidColors.appendChild(option);
    });
}

// إنشاء العبارات الجاهزة
function generatePresetMessages() {
    const presetMessages = document.getElementById('presetMessages');
    const messages = [
        'كل عام وأنتم بخير\nعيد مبارك',
        'عيد سعيد\nتقبل الله منا ومنكم',
        'عيد مبارك\nأعاده الله عليكم بالخير',
        'كل عام وأنتم بألف خير\nعيد فطر مبارك',
        'عيد أضحى مبارك\nكل عام وأنتم بخير',
        'بمناسبة العيد المبارك\nأسعد الله أيامكم'
    ];
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'preset-message';
        messageDiv.textContent = message.replace('\n', ' - ');
        messageDiv.addEventListener('click', () => {
            document.getElementById('cardText').value = message;
            updateCard();
        });
        presetMessages.appendChild(messageDiv);
    });
}

// تطبيق قالب
function applyTemplate(template) {
    setBackground(template.background);
    document.getElementById('primaryText').value = template.primaryText;
    document.getElementById('secondaryText').value = template.secondaryText;
    document.getElementById('primaryTextColor').value = template.primaryColor;
    document.getElementById('secondaryTextColor').value = template.secondaryColor;
    updateCard();

    // إزالة التحديد السابق وإضافة التحديد الجديد
    document.querySelectorAll('.template-item').forEach(item => item.classList.remove('active'));
    event.target.closest('.template-item').classList.add('active');
}

// تطبيق التدرج المخصص
function applyCustomGradient() {
    const color1 = document.getElementById('gradientColor1').value;
    const color2 = document.getElementById('gradientColor2').value;
    const color3 = document.getElementById('gradientColor3').value;

    let gradient;
    if (color3 && color3 !== '#f093fb') {
        gradient = `linear-gradient(135deg, ${color1}, ${color2}, ${color3})`;
    } else {
        gradient = `linear-gradient(135deg, ${color1}, ${color2})`;
    }

    setBackground(gradient);
}

// التعامل مع صورة الخلفية
function handleBackgroundImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                backgroundImage = img;
                updateCard();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// تعيين الخلفية
function setBackground(background) {
    currentBackground = background;
    updateCard();
    
    // تحديث التحديد
    document.querySelectorAll('.bg-option').forEach(option => option.classList.remove('active'));
    event.target.classList.add('active');
}

// إضافة عنصر تصميمي مع تجنب التداخل المحسن
function addDesignElement(elementType) {
    // فحص إذا كان التصميم ممتلئ
    if (elements.length >= 15) {
        alert('التصميم ممتلئ! لا يمكن إضافة المزيد من العناصر.');
        return;
    }

    let x, y;
    let attempts = 0;
    const maxAttempts = 100;
    const elementSize = 30;
    const minDistance = 80; // مسافة أكبر بين العناصر

    // البحث عن موقع فارغ
    do {
        x = Math.random() * (canvas.width - elementSize * 2) + elementSize;
        y = Math.random() * (canvas.height - elementSize * 2) + elementSize;
        attempts++;
    } while (isPositionOccupied(x, y, minDistance) && attempts < maxAttempts);

    // إذا لم نجد موقع فارغ بعد المحاولات
    if (attempts >= maxAttempts) {
        alert('لا يوجد مساحة كافية لإضافة عنصر جديد!');
        return;
    }

    const element = {
        type: elementType,
        x: x,
        y: y,
        size: elementSize,
        color: selectedElementColor,
        rotation: 0,
        opacity: 1,
        id: Date.now() + Math.random(),
        locked: false
    };

    elements.push(element);
    updateCard();
    saveState();
}

// فحص ما إذا كان الموقع مشغولاً مع مراعاة النصوص
function isPositionOccupied(x, y, minDistance) {
    // فحص التداخل مع العناصر الأخرى
    const elementOverlap = elements.some(element => {
        const distance = Math.sqrt((x - element.x) ** 2 + (y - element.y) ** 2);
        return distance < minDistance;
    });

    // فحص التداخل مع منطقة النصوص
    const textAreaTop = canvas.height / 2 - 80;
    const textAreaBottom = canvas.height / 2 + 80;
    const textAreaLeft = canvas.width / 2 - 150;
    const textAreaRight = canvas.width / 2 + 150;

    const textOverlap = (x > textAreaLeft && x < textAreaRight &&
                        y > textAreaTop && y < textAreaBottom);

    return elementOverlap || textOverlap;
}

// تحديث العنصر المحدد
function updateSelectedElement() {
    if (!selectedElement) return;

    selectedElement.size = parseInt(document.getElementById('elementSize').value);
    selectedElement.opacity = parseFloat(document.getElementById('elementOpacity').value);
    selectedElement.color = document.getElementById('elementColor').value;
    selectedElement.rotation = parseInt(document.getElementById('elementRotation').value) * Math.PI / 180;

    // تحديث التحكم السريع أيضاً
    updateQuickControlsFromSelected();
    updateCard();
}

// تحديث العنصر المحدد من التحكم السريع
function updateSelectedElementQuick() {
    if (!selectedElement) return;

    selectedElement.size = parseInt(document.getElementById('quickElementSize').value);
    selectedElement.opacity = parseFloat(document.getElementById('quickElementOpacity').value);

    // تحديث التحكم المفصل أيضاً
    document.getElementById('elementSize').value = selectedElement.size;
    document.getElementById('elementSizeValue').textContent = selectedElement.size + 'px';
    document.getElementById('elementOpacity').value = selectedElement.opacity;
    document.getElementById('elementOpacityValue').textContent = Math.round(selectedElement.opacity * 100) + '%';

    updateCard();
    saveState();
}

// تحديث التحكم السريع من العنصر المحدد
function updateQuickControlsFromSelected() {
    if (!selectedElement) return;

    document.getElementById('quickElementSize').value = selectedElement.size;
    document.getElementById('quickElementSizeValue').textContent = selectedElement.size + 'px';
    document.getElementById('quickElementOpacity').value = selectedElement.opacity;
    document.getElementById('quickElementOpacityValue').textContent = Math.round(selectedElement.opacity * 100) + '%';
}

// حذف العنصر المحدد
function deleteSelectedElement() {
    if (!selectedElement) return;

    const index = elements.findIndex(el => el.id === selectedElement.id);
    if (index > -1) {
        elements.splice(index, 1);
        selectedElement = null;
        hideElementControls();
        updateCard();
        saveState();
    }
}

// حذف العنصر المحدد مع التأكيد
function deleteSelectedElementWithConfirm() {
    if (!selectedElement) return;
    showConfirmModal();
}

// إظهار صندوق التأكيد
function showConfirmModal() {
    if (!selectedElement) return;
    pendingDeleteElement = selectedElement;
    document.getElementById('confirmModal').style.display = 'flex';
}

// تأكيد الحذف
function confirmDeleteElement() {
    if (pendingDeleteElement) {
        const index = elements.findIndex(el => el.id === pendingDeleteElement.id);
        if (index > -1) {
            elements.splice(index, 1);
            if (selectedElement && selectedElement.id === pendingDeleteElement.id) {
                selectedElement = null;
                hideElementControls();
                hideFloatingPanel();
            }
            updateCard();
            saveState();
        }
    }
    hideConfirmModal();
}

// إلغاء الحذف
function cancelDeleteElement() {
    hideConfirmModal();
}

// إخفاء صندوق التأكيد
function hideConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    pendingDeleteElement = null;
}

// إظهار عناصر التحكم
function showElementControls(element) {
    selectedElement = element;
    const controls = document.getElementById('elementControls');
    const quickControls = document.getElementById('quickElementControls') || document.querySelector('.quick-element-controls');

    controls.style.display = 'block';
    controls.classList.add('active');

    if (quickControls) {
        quickControls.classList.add('active');
    }

    // إظهار لوحة التحكم العائمة
    showFloatingPanel(element);

    // تحديث القيم
    document.getElementById('elementSize').value = element.size;
    document.getElementById('elementSizeValue').textContent = element.size + 'px';
    document.getElementById('elementOpacity').value = element.opacity;
    document.getElementById('elementOpacityValue').textContent = Math.round(element.opacity * 100) + '%';
    document.getElementById('elementColor').value = element.color;
    document.getElementById('elementRotation').value = Math.round(element.rotation * 180 / Math.PI);
    document.getElementById('elementRotationValue').textContent = Math.round(element.rotation * 180 / Math.PI) + '°';

    // تحديث التحكم السريع
    updateQuickControlsFromSelected();

    // تحديث لوحة الألوان لتعكس لون العنصر المحدد
    selectedElementColor = element.color;
    document.getElementById('customElementColor').value = element.color;
    updateColorPaletteSelection();

    // تحديث حالة القفل
    const lockBtn = document.getElementById('lockElement');
    if (element.locked) {
        lockBtn.innerHTML = '<i class="fas fa-unlock"></i> إلغاء القفل';
        lockBtn.className = 'btn btn-small btn-warning';
    } else {
        lockBtn.innerHTML = '<i class="fas fa-lock"></i> قفل العنصر';
        lockBtn.className = 'btn btn-small btn-secondary';
    }
}

// قفل/إلغاء قفل العنصر
function toggleElementLock() {
    if (!selectedElement) return;

    selectedElement.locked = !selectedElement.locked;
    showElementControls(selectedElement);
    updateCard();
    saveState();
}

// قفل/إلغاء قفل جميع العناصر
function toggleAllElementsLock() {
    const allLocked = elements.every(el => el.locked);
    elements.forEach(el => el.locked = !allLocked);

    if (selectedElement) {
        showElementControls(selectedElement);
    }

    updateCard();
    saveState();

    const btn = document.getElementById('lockAllElements');
    if (allLocked) {
        btn.innerHTML = '<i class="fas fa-lock"></i> قفل جميع العناصر';
        btn.className = 'btn btn-secondary';
    } else {
        btn.innerHTML = '<i class="fas fa-unlock"></i> إلغاء قفل الكل';
        btn.className = 'btn btn-warning';
    }
}

// إلغاء صورة الخلفية
function removeBackgroundImage() {
    backgroundImage = null;
    document.getElementById('backgroundImage').value = '';
    updateCard();
    saveState();
}

// تطبيق اللون المحدد على جميع العناصر
function applyColorToAllElements() {
    if (elements.length === 0) {
        alert('لا توجد عناصر لتطبيق اللون عليها!');
        return;
    }

    if (confirm(`هل تريد تطبيق اللون ${selectedElementColor} على جميع العناصر؟`)) {
        elements.forEach(element => {
            element.color = selectedElementColor;
        });

        // إذا كان هناك عنصر محدد، قم بتحديث لونه في عناصر التحكم
        if (selectedElement) {
            document.getElementById('elementColor').value = selectedElementColor;
        }

        updateCard();
        saveState();
    }
}

// إخفاء عناصر التحكم
function hideElementControls() {
    const controls = document.getElementById('elementControls');
    const quickControls = document.getElementById('quickElementControls') || document.querySelector('.quick-element-controls');

    controls.style.display = 'none';
    controls.classList.remove('active');

    if (quickControls) {
        quickControls.classList.remove('active');
    }

    hideFloatingPanel();
    selectedElement = null;
}

// إظهار لوحة التحكم العائمة
function showFloatingPanel(element) {
    const panel = document.getElementById('floatingElementPanel');
    panel.style.display = 'block';

    // تحديث القيم في لوحة التحكم العائمة
    document.getElementById('floatingElementColor').value = element.color;
    document.getElementById('floatingElementSize').value = element.size;
    document.getElementById('floatingElementSizeValue').textContent = element.size + 'px';
    document.getElementById('floatingElementOpacity').value = element.opacity;
    document.getElementById('floatingElementOpacityValue').textContent = Math.round(element.opacity * 100) + '%';
    document.getElementById('floatingElementRotation').value = Math.round(element.rotation * 180 / Math.PI);
    document.getElementById('floatingElementRotationValue').textContent = Math.round(element.rotation * 180 / Math.PI) + '°';

    // تحديث ألوان الاختيار السريع
    updateFloatingColorPresets();

    // تحديث زر القفل
    const lockBtn = document.getElementById('floatingLockBtn');
    if (element.locked) {
        lockBtn.innerHTML = '<i class="fas fa-unlock"></i> إلغاء القفل';
        lockBtn.className = 'btn btn-warning btn-small';
    } else {
        lockBtn.innerHTML = '<i class="fas fa-lock"></i> قفل';
        lockBtn.className = 'btn btn-secondary btn-small';
    }
}

// إخفاء لوحة التحكم العائمة
function hideFloatingPanel() {
    document.getElementById('floatingElementPanel').style.display = 'none';
}

// تحديث ألوان الاختيار السريع في لوحة التحكم العائمة
function updateFloatingColorPresets() {
    const presetsContainer = document.getElementById('floatingColorPresets');
    presetsContainer.innerHTML = '';

    const colors = [
        '#4299e1', '#48bb78', '#ed8936', '#9f7aea',
        '#ed64a6', '#38b2ac', '#ecc94b', '#e53e3e',
        '#2d3748', '#718096', '#ffffff', '#000000'
    ];

    colors.forEach(color => {
        const preset = document.createElement('div');
        preset.className = 'color-preset';
        preset.style.backgroundColor = color;
        if (selectedElement && selectedElement.color === color) {
            preset.classList.add('active');
        }
        preset.addEventListener('click', () => {
            if (selectedElement) {
                selectedElement.color = color;
                document.getElementById('floatingElementColor').value = color;
                document.getElementById('elementColor').value = color;
                selectedElementColor = color;
                document.getElementById('customElementColor').value = color;
                updateColorPaletteSelection();
                updateFloatingColorPresets();
                updateCard();
                saveState();
            }
        });
        presetsContainer.appendChild(preset);
    });
}

// وظائف التحديث للوحة التحكم العائمة
function updateFloatingElementColor() {
    if (!selectedElement) return;
    const color = document.getElementById('floatingElementColor').value;
    selectedElement.color = color;
    selectedElementColor = color;
    document.getElementById('elementColor').value = color;
    document.getElementById('customElementColor').value = color;
    updateColorPaletteSelection();
    updateFloatingColorPresets();
    updateCard();
    saveState();
}

function updateFloatingElementSize() {
    if (!selectedElement) return;
    const size = parseInt(document.getElementById('floatingElementSize').value);
    selectedElement.size = size;
    document.getElementById('floatingElementSizeValue').textContent = size + 'px';
    document.getElementById('elementSize').value = size;
    document.getElementById('elementSizeValue').textContent = size + 'px';
    document.getElementById('quickElementSize').value = size;
    document.getElementById('quickElementSizeValue').textContent = size + 'px';
    updateCard();
    saveState();
}

function updateFloatingElementOpacity() {
    if (!selectedElement) return;
    const opacity = parseFloat(document.getElementById('floatingElementOpacity').value);
    selectedElement.opacity = opacity;
    document.getElementById('floatingElementOpacityValue').textContent = Math.round(opacity * 100) + '%';
    document.getElementById('elementOpacity').value = opacity;
    document.getElementById('elementOpacityValue').textContent = Math.round(opacity * 100) + '%';
    document.getElementById('quickElementOpacity').value = opacity;
    document.getElementById('quickElementOpacityValue').textContent = Math.round(opacity * 100) + '%';
    updateCard();
    saveState();
}

function updateFloatingElementRotation() {
    if (!selectedElement) return;
    const rotation = parseInt(document.getElementById('floatingElementRotation').value);
    selectedElement.rotation = rotation * Math.PI / 180;
    document.getElementById('floatingElementRotationValue').textContent = rotation + '°';
    document.getElementById('elementRotation').value = rotation;
    document.getElementById('elementRotationValue').textContent = rotation + '°';
    updateCard();
    saveState();
}

function toggleElementLockFromFloating() {
    if (!selectedElement) return;
    selectedElement.locked = !selectedElement.locked;

    // تحديث زر القفل في لوحة التحكم العائمة
    const floatingLockBtn = document.getElementById('floatingLockBtn');
    const lockBtn = document.getElementById('lockElement');

    if (selectedElement.locked) {
        floatingLockBtn.innerHTML = '<i class="fas fa-unlock"></i> إلغاء القفل';
        floatingLockBtn.className = 'btn btn-warning btn-small';
        lockBtn.innerHTML = '<i class="fas fa-unlock"></i> إلغاء القفل';
        lockBtn.className = 'btn btn-small btn-warning';
    } else {
        floatingLockBtn.innerHTML = '<i class="fas fa-lock"></i> قفل';
        floatingLockBtn.className = 'btn btn-secondary btn-small';
        lockBtn.innerHTML = '<i class="fas fa-lock"></i> قفل العنصر';
        lockBtn.className = 'btn btn-small btn-secondary';
    }

    updateCard();
    saveState();
}

// رسم البطاقة الأولية
function drawInitialCard() {
    updateCard();
}

// تحديث البطاقة
function updateCard() {
    // مسح الكانفاس
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم الخلفية
    drawBackground();
    
    // رسم العناصر التصميمية
    elements.forEach(element => {
        drawElement(element);
    });
    
    // رسم النص
    drawText();
}

// رسم الخلفية المحسنة
function drawBackground() {
    // رسم الخلفية الأساسية
    if (currentBackground.includes('gradient')) {
        // إنشاء تدرج
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

        // استخراج الألوان من التدرج
        const colors = currentBackground.match(/#[a-fA-F0-9]{6}/g);
        if (colors && colors.length >= 3) {
            gradient.addColorStop(0, colors[0]);
            gradient.addColorStop(0.5, colors[1]);
            gradient.addColorStop(1, colors[2]);
        } else if (colors && colors.length >= 2) {
            gradient.addColorStop(0, colors[0]);
            gradient.addColorStop(1, colors[1]);
        } else {
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
        }

        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = currentBackground;
    }

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // رسم صورة الخلفية إذا كانت موجودة
    if (backgroundImage) {
        ctx.save();
        ctx.globalAlpha = parseFloat(document.getElementById('backgroundOpacity').value);

        // حساب الأبعاد للحفاظ على النسبة
        const imgAspect = backgroundImage.width / backgroundImage.height;
        const canvasAspect = canvas.width / canvas.height;

        let drawWidth, drawHeight, drawX, drawY;

        if (imgAspect > canvasAspect) {
            drawHeight = canvas.height;
            drawWidth = drawHeight * imgAspect;
            drawX = (canvas.width - drawWidth) / 2;
            drawY = 0;
        } else {
            drawWidth = canvas.width;
            drawHeight = drawWidth / imgAspect;
            drawX = 0;
            drawY = (canvas.height - drawHeight) / 2;
        }

        ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
    }
}

// رسم العناصر مع الشفافية والقفل
function drawElement(element) {
    ctx.save();
    ctx.translate(element.x, element.y);
    ctx.rotate(element.rotation);
    ctx.globalAlpha = element.opacity;
    ctx.fillStyle = element.color;

    // إضافة حدود للعنصر المحدد أو المقفل
    if (selectedElement && selectedElement.id === element.id) {
        ctx.strokeStyle = element.locked ? '#4299e1' : '#e53e3e';
        ctx.lineWidth = 2;
        ctx.setLineDash(element.locked ? [10, 5] : [5, 5]);
    } else if (element.locked) {
        ctx.strokeStyle = '#4299e1';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
    }

    switch (element.type) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(0, 0, element.size, 0, Math.PI * 2);
            ctx.fill();
            if ((selectedElement && selectedElement.id === element.id) || element.locked) ctx.stroke();
            break;
        case 'square':
            ctx.fillRect(-element.size/2, -element.size/2, element.size, element.size);
            if ((selectedElement && selectedElement.id === element.id) || element.locked) {
                ctx.strokeRect(-element.size/2, -element.size/2, element.size, element.size);
            }
            break;
        case 'star':
            drawStar(ctx, 0, 0, 5, element.size, element.size/2);
            if ((selectedElement && selectedElement.id === element.id) || element.locked) ctx.stroke();
            break;
        case 'crescent':
            drawCrescent(ctx, 0, 0, element.size);
            if ((selectedElement && selectedElement.id === element.id) || element.locked) ctx.stroke();
            break;
        case 'triangle':
            drawTriangle(ctx, 0, 0, element.size);
            if ((selectedElement && selectedElement.id === element.id) || element.locked) ctx.stroke();
            break;
        case 'heart':
            drawHeart(ctx, 0, 0, element.size);
            if ((selectedElement && selectedElement.id === element.id) || element.locked) ctx.stroke();
            break;
    }

    // رسم أيقونة القفل للعناصر المقفلة
    if (element.locked) {
        ctx.restore();
        ctx.save();
        ctx.translate(element.x + element.size + 10, element.y - element.size - 10);
        ctx.fillStyle = '#4299e1';
        ctx.font = '12px FontAwesome';
        ctx.fillText('🔒', 0, 0);
    }

    // رسم زر X للعنصر المحدد
    if (selectedElement && selectedElement.id === element.id) {
        ctx.restore();
        ctx.save();

        const deleteButtonX = element.x + element.size + 8;
        const deleteButtonY = element.y - element.size - 8;
        const buttonSize = 20;

        // رسم ظل الزر
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(deleteButtonX + 1, deleteButtonY + 1, buttonSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // رسم خلفية الزر مع تدرج
        const gradient = ctx.createRadialGradient(deleteButtonX, deleteButtonY, 0, deleteButtonX, deleteButtonY, buttonSize / 2);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(1, '#e53e3e');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(deleteButtonX, deleteButtonY, buttonSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // رسم حدود الزر
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // رسم علامة X
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        const crossSize = 7;
        ctx.beginPath();
        ctx.moveTo(deleteButtonX - crossSize/2, deleteButtonY - crossSize/2);
        ctx.lineTo(deleteButtonX + crossSize/2, deleteButtonY + crossSize/2);
        ctx.moveTo(deleteButtonX + crossSize/2, deleteButtonY - crossSize/2);
        ctx.lineTo(deleteButtonX - crossSize/2, deleteButtonY + crossSize/2);
        ctx.stroke();

        // حفظ موقع زر الحذف للتفاعل
        element.deleteButtonX = deleteButtonX;
        element.deleteButtonY = deleteButtonY;
        element.deleteButtonSize = buttonSize;
    }

    ctx.restore();
}

// رسم النجمة
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

// رسم الهلال بشكل صحيح ومثالي
function drawCrescent(ctx, cx, cy, radius) {
    ctx.save();

    // إعدادات الهلال
    const outerRadius = radius;
    const innerRadius = radius * 0.65;
    const offsetX = radius * 0.35;
    const offsetY = 0;

    // رسم الهلال الأساسي
    ctx.beginPath();

    // الدائرة الخارجية
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2, false);

    // الدائرة الداخلية المزاحة لإنشاء شكل الهلال
    ctx.arc(cx + offsetX, cy + offsetY, innerRadius, 0, Math.PI * 2, true);

    // ملء الهلال
    ctx.fill('evenodd');

    // إضافة تأثير الإضاءة والعمق
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';

    // تدرج الإضاءة من اليسار
    const lightGradient = ctx.createLinearGradient(
        cx - radius, cy,
        cx + radius, cy
    );
    lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    lightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
    lightGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');

    ctx.fillStyle = lightGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2, false);
    ctx.arc(cx + offsetX, cy + offsetY, innerRadius, 0, Math.PI * 2, true);
    ctx.fill('evenodd');

    ctx.restore();

    // إضافة ظل داخلي ناعم
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';

    const shadowGradient = ctx.createRadialGradient(
        cx + offsetX * 0.5, cy, innerRadius * 0.3,
        cx + offsetX * 0.5, cy, innerRadius
    );
    shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

    ctx.fillStyle = shadowGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2, false);
    ctx.arc(cx + offsetX, cy + offsetY, innerRadius, 0, Math.PI * 2, true);
    ctx.fill('evenodd');

    ctx.restore();

    ctx.restore();
}

// رسم المثلث
function drawTriangle(ctx, cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx - size, cy + size);
    ctx.lineTo(cx + size, cy + size);
    ctx.closePath();
    ctx.fill();
}

// رسم القلب
function drawHeart(ctx, cx, cy, size) {
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(cx, cy + topCurveHeight);
    // Left curve
    ctx.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + topCurveHeight);
    ctx.bezierCurveTo(cx - size / 2, cy + (size + topCurveHeight) / 2, cx, cy + (size + topCurveHeight) / 2, cx, cy + size);
    // Right curve
    ctx.bezierCurveTo(cx, cy + (size + topCurveHeight) / 2, cx + size / 2, cy + (size + topCurveHeight) / 2, cx + size / 2, cy + topCurveHeight);
    ctx.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + topCurveHeight);
    ctx.fill();
}

// رسم النصوص المحسن (أساسي وثانوي)
function drawText() {
    const primaryText = document.getElementById('primaryText').value;
    const secondaryText = document.getElementById('secondaryText').value;
    const primaryFontSize = document.getElementById('primaryFontSize').value;
    const secondaryFontSize = document.getElementById('secondaryFontSize').value;
    const primaryTextColor = document.getElementById('primaryTextColor').value;
    const secondaryTextColor = document.getElementById('secondaryTextColor').value;
    const fontFamily = document.getElementById('fontFamily').value;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // رسم النص الأساسي
    if (primaryText.trim()) {
        ctx.font = `bold ${primaryFontSize}px ${fontFamily}`;
        ctx.fillStyle = primaryTextColor;

        const primaryLines = primaryText.split('\n');
        const primaryLineHeight = parseInt(primaryFontSize) * 1.2;
        const primaryStartY = canvas.height / 2 - 40;

        primaryLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, primaryStartY + index * primaryLineHeight);
        });
    }

    // رسم النص الثانوي
    if (secondaryText.trim()) {
        ctx.font = `${secondaryFontSize}px ${fontFamily}`;
        ctx.fillStyle = secondaryTextColor;

        const secondaryLines = secondaryText.split('\n');
        const secondaryLineHeight = parseInt(secondaryFontSize) * 1.2;
        const secondaryStartY = canvas.height / 2 + 40;

        secondaryLines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, secondaryStartY + index * secondaryLineHeight);
        });
    }
}

// التعامل مع الضغط على الماوس
function handleMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // البحث عن عنصر تم النقر عليه
    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];

        // فحص النقر على زر الحذف أولاً
        if (selectedElement && selectedElement.id === element.id &&
            element.deleteButtonX && element.deleteButtonY) {
            const deleteDistance = Math.sqrt((x - element.deleteButtonX) ** 2 + (y - element.deleteButtonY) ** 2);
            if (deleteDistance <= element.deleteButtonSize / 2) {
                deleteSelectedElementWithConfirm();
                return;
            }
        }

        // فحص النقر على العنصر نفسه
        const distance = Math.sqrt((x - element.x) ** 2 + (y - element.y) ** 2);
        if (distance <= element.size) {
            selectedElement = element;
            showElementControls(element);

            // فقط إذا لم يكن العنصر مقفلاً
            if (!element.locked) {
                isDragging = true;
                dragOffset.x = x - element.x;
                dragOffset.y = y - element.y;
                canvas.style.cursor = 'grabbing';
            } else {
                canvas.style.cursor = 'not-allowed';
            }
            updateCard();
            return;
        }
    }

    // إذا لم يتم النقر على عنصر، إخفاء عناصر التحكم
    hideElementControls();
    updateCard();
}

// التعامل مع حركة الماوس
function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // فحص hover على زر الحذف
    let isHoveringDeleteButton = false;
    if (selectedElement && selectedElement.deleteButtonX && selectedElement.deleteButtonY) {
        const deleteDistance = Math.sqrt((x - selectedElement.deleteButtonX) ** 2 + (y - selectedElement.deleteButtonY) ** 2);
        if (deleteDistance <= selectedElement.deleteButtonSize / 2) {
            canvas.style.cursor = 'pointer';
            isHoveringDeleteButton = true;
        }
    }

    if (!isDragging) {
        if (!isHoveringDeleteButton) {
            canvas.style.cursor = 'default';
        }
        return;
    }

    if (!selectedElement) return;

    // تحديث موقع العنصر
    selectedElement.x = x - dragOffset.x;
    selectedElement.y = y - dragOffset.y;

    // التأكد من بقاء العنصر داخل الكانفاس
    selectedElement.x = Math.max(selectedElement.size, Math.min(canvas.width - selectedElement.size, selectedElement.x));
    selectedElement.y = Math.max(selectedElement.size, Math.min(canvas.height - selectedElement.size, selectedElement.y));

    updateCard();
}

// التعامل مع رفع الماوس
function handleMouseUp(event) {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'default';
        saveState();
    }
}

// التعامل مع النقر المزدوج لحذف العنصر
function handleDoubleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // البحث عن عنصر تم النقر عليه
    for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        const distance = Math.sqrt((x - element.x) ** 2 + (y - element.y) ** 2);

        if (distance <= element.size) {
            selectedElement = element;
            deleteSelectedElementWithConfirm();
            return;
        }
    }
}

// حفظ الحالة للتراجع
function saveState() {
    currentStep++;
    if (currentStep < history.length) {
        history.length = currentStep;
    }
    history.push({
        background: currentBackground,
        elements: JSON.parse(JSON.stringify(elements)),
        primaryText: document.getElementById('primaryText').value,
        secondaryText: document.getElementById('secondaryText').value,
        backgroundImage: backgroundImage
    });
}

// التراجع
function undo() {
    if (currentStep > 0) {
        currentStep--;
        const state = history[currentStep];
        currentBackground = state.background;
        elements = JSON.parse(JSON.stringify(state.elements));
        document.getElementById('primaryText').value = state.primaryText || '';
        document.getElementById('secondaryText').value = state.secondaryText || '';
        backgroundImage = state.backgroundImage;
        hideElementControls();
        updateCard();
    }
}

// مسح الكانفاس
function clearCanvas() {
    elements = [];
    selectedElement = null;
    backgroundImage = null;
    document.getElementById('primaryText').value = 'عيد مبارك';
    document.getElementById('secondaryText').value = 'كل عام وأنتم بخير';
    document.getElementById('backgroundImage').value = '';
    currentBackground = 'linear-gradient(135deg, #667eea, #764ba2)';
    hideElementControls();
    updateCard();
    saveState();
}

// تحميل البطاقة
function downloadCard() {
    // إخفاء حدود العنصر المحدد قبل التحميل
    const tempSelected = selectedElement;
    selectedElement = null;
    updateCard();

    setTimeout(() => {
        const link = document.createElement('a');
        link.download = 'بطاقة-تهنئة-العيد.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        // إعادة تحديد العنصر
        selectedElement = tempSelected;
        updateCard();
    }, 100);
}

// تحديث العبارات الجاهزة للنصوص الجديدة
function generatePresetMessages() {
    const presetMessages = document.getElementById('presetMessages');
    const messages = [
        { primary: 'عيد مبارك', secondary: 'كل عام وأنتم بخير' },
        { primary: 'عيد سعيد', secondary: 'تقبل الله منا ومنكم' },
        { primary: 'عيد فطر مبارك', secondary: 'أعاده الله عليكم بالخير' },
        { primary: 'عيد أضحى مبارك', secondary: 'كل عام وأنتم بألف خير' },
        { primary: 'تهانينا بالعيد', secondary: 'أسعد الله أيامكم' },
        { primary: 'عيد مبارك', secondary: 'وكل عام وأنتم بصحة وسعادة' }
    ];

    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'preset-message';
        messageDiv.innerHTML = `<strong>${message.primary}</strong><br><small>${message.secondary}</small>`;
        messageDiv.addEventListener('click', () => {
            document.getElementById('primaryText').value = message.primary;
            document.getElementById('secondaryText').value = message.secondary;
            updateCard();
        });
        presetMessages.appendChild(messageDiv);
    });
}

// حفظ الحالة الأولية
setTimeout(() => {
    saveState();
}, 100);
