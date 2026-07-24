const highSignalLunarTerms = /\b(lunar|moon|cislunar|artemis|clps)\b/i;
const gatewayTerm = /\bgateway\b/i;
const gatewaySpaceContext = /\b(space|lunar|moon|cislunar|artemis|orbital|spacecraft|lander)\b/i;
const nasaAgency = /\b(nasa|national aeronautics and space administration)\b/i;

export function isDirectLunarContract(description = "", customerName = "") {
    if (highSignalLunarTerms.test(description)) return true;
    if (!gatewayTerm.test(description)) return false;

    return nasaAgency.test(customerName) || gatewaySpaceContext.test(description);
}
