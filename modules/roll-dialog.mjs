/**
 * Display a dialog for rolling with modifiers
 * @param {string} title - Dialog title
 * @param {number} baseTarget - The base target number
 * @param {Function} rollCallback - Callback function to execute the roll
 * @returns {Promise}
 */
export async function showRollDialog(title, baseTarget, rollCallback) {
    return new Promise((resolve) => {
        const dialogContent = `
            <form class="fvtt-wfrp2e-roll-dialog">
                <div class="form-group">
                    <label>Base Target Number:</label>
                    <input type="number" name="base-target" value="${baseTarget}" disabled />
                </div>
                <div class="form-group">
                    <label>Modifier:</label>
                    <input type="number" name="modifier" value="0" placeholder="+10 or -10" autofocus />
                </div>
                <div class="form-group">
                    <label>Roll Mode:</label>
                    <select name="roll-mode">
                        <option value="publicroll">Public Roll</option>
                        <option value="gmroll">GM Roll</option>
                        <option value="blindroll">Blind Roll</option>
                        <option value="selfroll">Self Roll</option>
                    </select>
                </div>
            </form>
        `;

        new Dialog({
            title: title,
            content: dialogContent,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-dice-d20"></i>',
                    label: "Roll",
                    callback: (html) => {
                        const modifier = parseInt(html.find('[name="modifier"]').val()) || 0;
                        const rollMode = html.find('[name="roll-mode"]').val();
                        const finalTarget = baseTarget + modifier;
                        
                        rollCallback(finalTarget, modifier, rollMode);
                        resolve(true);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => resolve(false)
                }
            },
            default: "roll",
            render: (html) => {
                // Update final target when modifier changes
                html.find('[name="modifier"]').on('input', function() {
                    const modifier = parseInt($(this).val()) || 0;
                    const finalTarget = baseTarget + modifier;
                    html.find('.final-target').val(finalTarget);
                });
            }
        }).render(true);
    });
}