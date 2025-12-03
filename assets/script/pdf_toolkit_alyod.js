const {PDFDocument} = PDFLib;

// Queues to store file objects
let mergeQueue= [];
let imageQueue= [];

// Generic Helpers
const readFileAsync = (file) => {
    return new Promise((resolve, reject)=>{
        let reader= new FileReader();
        reader.onload= ()=>resolve(reader.result);
        reader.onerror= reject;
        reader.readAsArrayBuffer(file);
    });
};
const downloadPdf = (pdfBytes, fileName) => {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
};

// --- UI HELPER: RENDER LIST ---
function renderQueue(queue, listId) {
    const $list = $(listId);
    $list.empty();

    if (queue.length === 0) {
        $list.append('<li style="padding:10px; text-align:center; color:#999;">Queue is empty</li>');
        return;
    }

    queue.forEach((file, index) => {
        const html = `
            <li class="file-item" data-index="${index}">
                <span class="file-name">${file.name}</span>
                <div class="controls">
                    <button class="move-up">↑</button>
                    <button class="move-down">↓</button>
                    <button class="remove-btn">✕</button>
                </div>
            </li>
        `;
        $list.append(html);
    });
}

// --- UI HELPER: ATTACH LIST LISTENERS ---
function attachListListeners(listId, getQueue, setQueue) {
    $(listId).on('click', '.move-up', function() {
        const index = $(this).closest('li').data('index');
        let queue = getQueue();
        if (index > 0) {
            [queue[index], queue[index - 1]] = [queue[index - 1], queue[index]];
            setQueue(queue);
            renderQueue(queue, listId);
        }
    });
    $(listId).on('click', '.move-down', function() {
        const index = $(this).closest('li').data('index');
        let queue = getQueue();
        if (index < queue.length - 1) {
            [queue[index], queue[index + 1]] = [queue[index + 1], queue[index]];
            setQueue(queue);
            renderQueue(queue, listId);
        }
    });
    $(listId).on('click', '.remove-btn', function() {
        const index = $(this).closest('li').data('index');
        let queue = getQueue();
        queue.splice(index, 1);
        setQueue(queue);
        renderQueue(queue, listId);
    });
    }

/* ---------- */

$(document).ready(function() {

    // ==========================================
    // 1. MERGE LOGIC
    // ==========================================
    attachListListeners('#mergeList', () => mergeQueue, (q) => mergeQueue = q);

    $('#mergeInput').change(function() {
        mergeQueue = mergeQueue.concat(Array.from(this.files));
        renderQueue(mergeQueue, '#mergeList');
        $(this).val(''); 
    });

    $('#btnMerge').click(async function() {
        if (mergeQueue.length < 2) { alert("Add at least 2 PDFs."); return; }
        $(this).text('Processing...').prop('disabled', true);

        try {
            const mergedPdf = await PDFDocument.create();
            for (let file of mergeQueue) {
                const fileBytes = await readFileAsync(file);
                const pdf = await PDFDocument.load(fileBytes);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            downloadPdf(await mergedPdf.save(), 'merged.pdf');
        } catch (err) { console.error(err); alert("Error merging."); } 
        finally { $(this).text('Merge PDFs').prop('disabled', false); }
    });

    // ==========================================
    // 2. IMAGES TO PDF LOGIC (NEW FEATURE)
    // ==========================================
    attachListListeners('#imageList', () => imageQueue, (q) => imageQueue = q);

    $('#imageInput').change(function() {
        imageQueue = imageQueue.concat(Array.from(this.files));
        renderQueue(imageQueue, '#imageList');
        $(this).val(''); 
    });

    $('#btnImgToPdf').click(async function() {
        if (imageQueue.length === 0) { alert("Add at least 1 image."); return; }
        $(this).text('Processing...').prop('disabled', true);

        try {
            const newPdf = await PDFDocument.create();

            for (let file of imageQueue) {
                const fileBytes = await readFileAsync(file);
                let image;
                
                // Embed based on type
                if (file.type === 'image/jpeg') {
                    image = await newPdf.embedJpg(fileBytes);
                } else if (file.type === 'image/png') {
                    image = await newPdf.embedPng(fileBytes);
                } else {
                    console.warn("Skipping unsupported file: " + file.name);
                    continue;
                }

                // Create page matching image dimensions
                const page = newPdf.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }

            downloadPdf(await newPdf.save(), 'images_combined.pdf');
        } catch (err) { console.error(err); alert("Error converting images."); }
        finally { $(this).text('Convert Images to PDF').prop('disabled', false); }
    });

    // ==========================================
    // 3. SPLIT LOGIC
    // ==========================================
    $('#btnSplit').click(async function() {
        const files = $('#splitInput')[0].files;
        const rangeStr = $('#pageRange').val();
        if (files.length === 0 || !rangeStr) { alert("Select PDF and Range."); return; }
        
        $(this).text('Processing...').prop('disabled', true);
        try {
            const fileBytes = await readFileAsync(files[0]);
            const sourcePdf = await PDFDocument.load(fileBytes);
            const totalPages = sourcePdf.getPageCount();
            
            // Parse Range
            const pagesToKeep = new Set();
            rangeStr.split(',').forEach(part => {
                part = part.trim();
                if (part.includes('-')) {
                    const [s, e] = part.split('-').map(n => parseInt(n));
                    const low = Math.min(s,e), high = Math.max(s,e);
                    for(let i=low; i<=high; i++) if(i>=1 && i<=totalPages) pagesToKeep.add(i-1);
                } else {
                    const p = parseInt(part);
                    if(p>=1 && p<=totalPages) pagesToKeep.add(p-1);
                }
            });

            const sortedIndices = Array.from(pagesToKeep).sort((a,b)=>a-b);
            if (sortedIndices.length === 0) throw new Error("No valid pages selected");

            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(sourcePdf, sortedIndices);
            copiedPages.forEach((p) => newPdf.addPage(p));
            
            downloadPdf(await newPdf.save(), 'extracted_pages.pdf');
        } catch (err) { console.error(err); alert("Error splitting: " + err.message); }
        finally { $(this).text('Extract Pages').prop('disabled', false); }
    });

});
