import { Router, type Request, type Response } from 'express';
import { TEMPLATES, type TemplateId } from '../config/templates';

const router = Router();

router.get('/', (req: Request, res: Response) => {
try {
    const templates = Object.values(TEMPLATES).map(template => ({
        id: template.id,
        label: template.label,
        modelTier: template.modelTier,
    }));

    res.status(200).json({
        message: 'Templates fetched successfully',
        templates,
        count: templates.length
    });
} catch (error) {
    res.status(500).json({
        message: 'Failed to fetch templates',
        error: error instanceof Error ? error.message : 'Unknown error'
    });
}
});

router.get('/:id', (req: Request, res: Response) => {
try {
    const { id } = req.params;
    const template_id = id as string as TemplateId;
    const template = TEMPLATES[template_id];
    
    if (!template) {
        return res.status(404).json({
            message: 'Template not found',
        });
    }

    res.status(200).json({
        message: 'Template fetched successfully',
        template,
    });
} catch (error) {
    res.status(500).json({
        message: 'Failed to fetch template',
        error: error instanceof Error ? error.message : 'Unknown error'
    });
}
});

export default router;