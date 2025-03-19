const fs = require("fs");
const axios = require("axios");
const xlsx = require("xlsx");
require("dotenv").config();

const API_KEY = process.env.GOOGLE_API_KEY;
const CX = process.env.GOOGLE_CSE_ID;

const inputFilePath = "prospeccao.xlsx";
const outputFilePath = "novoprospeccao.xlsx";
const logFilePath = "search_log.json";

function readExcelFile(filePath) {
	if (!fs.existsSync(filePath)) return [];
	const workbook = xlsx.readFile(filePath);
	const sheetName = workbook.SheetNames[0];
	return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

function writeExcelFile(filePath, data) {
	const worksheet = xlsx.utils.json_to_sheet(data);
	const workbook = xlsx.utils.book_new();
	xlsx.utils.book_append_sheet(workbook, worksheet, "Results");
	xlsx.writeFile(workbook, filePath);
	console.log(`✅ Progress saved to ${filePath}`);
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function logSearch(query, response, reason) {
	let logData = [];
	if (fs.existsSync(logFilePath)) {
		logData = JSON.parse(fs.readFileSync(logFilePath, "utf8"));
	}

	logData.push({
		query,
		response: response.data || "No response",
		reason,
		timestamp: new Date().toISOString(),
	});

	fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
}

async function searchGoogle(query) {
	try {
		await delay(500);
		const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
			params: { key: API_KEY, cx: CX, q: query },
		});
		if (!response.data.items || response.data.items.length === 0) {
			logSearch(query, response, "No search results found");
		}
		return response.data.items || [];
	} catch (error) {
		logSearch(query, { error: error.message }, "API Error");
		console.error(`❌ API Error: ${error.message}`);
		return [];
	}
}

function filterResults(results, companyName) {
	const blacklist = [
		"tiktok.com",
		"youtube.com",
		"indeed.com",
		"glassdoor.com",
		"twitter.com",
		"serasaexperian.com.br",
		"cnpj.biz",
		"econodata.com.br",
	];

	const filtered = results.filter((item) => {
		const url = item.link.toLowerCase();
		return !blacklist.some((domain) => url.includes(domain));
	});

	if (filtered.length === 0) {
		logSearch(companyName, results, "All results were blacklisted");
	}

	return filtered[0] || null;
}

function generateQueries(companyName) {
	return [
		`"${companyName}" site:.br`,
		`"${companyName}" "site oficial"`,
		`"${companyName}" site:gov.br`,
		`"${companyName}" "contato"`,
		`"${companyName}" -google.com -youtube.com -twitter.com`,
	];
}

async function processSearch() {
	const inputData = readExcelFile(inputFilePath);
	if (inputData.length === 0) {
		console.error(`Arquivo ${inputFilePath} não encontrado ou vazio!`);
		return;
	}

	let processedData = readExcelFile(outputFilePath);
	let processedCNPJs = new Set(processedData.map((row) => row.cnpj));

	console.log(`🔍 Encontrado ${inputData.length}. Processados: ${processedData.length}`);

	for (const row of inputData) {
		if (processedCNPJs.has(row.cnpj)) {
			console.log(`✅ ${row.nomeFantasia} Já Processado...`);
			continue;
		}

		const companyName = row.nomeFantasia ? row.nomeFantasia.trim() : "";
		if (!companyName) {
			processedData.push({ ...row, linkSite: "Sem Nome" });
			continue;
		}

		console.log(`🔎 Procurando por: ${companyName}`);

		let bestLink = "Resultado não encontrado";
		for (const query of generateQueries(companyName)) {
			const searchResults = await searchGoogle(query);
			if (searchResults.length > 0) {
				const filteredResult = filterResults(searchResults, companyName);
				bestLink = filteredResult ? filteredResult.link : bestLink;
				if (bestLink !== "Resultado não encontrado") break;
			}
		}

		if (bestLink === "Resultado não encontrado") {
			logSearch(companyName, [], "Sem resultados");
		}

		processedData.push({
			cnpj: row.cnpj,
			razaoSocial: row.razaoSocial,
			nomeFantasia: row.nomeFantasia,
			linkSite: bestLink,
			...row,
		});

		if (processedData.length % 10 === 0) {
			writeExcelFile(outputFilePath, processedData);
		}
	}

	writeExcelFile(outputFilePath, processedData);
	console.log("Processamento Completo!");
}

processSearch();
