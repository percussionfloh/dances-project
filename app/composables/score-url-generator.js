export function useScoreUrlGenerator() {
    const { public: { corelliTrioSonatasSha } } = useRuntimeConfig();

    function normalizeId(id) {
        return id.replace('schubert-', '').replace('gonzaga-', '');
    }

    function getComposer(id) {
        return id.split('-')[0];
    }

    function getGithubUser(id) {
        return id.includes('schubert') ? 'WolfgangDrescher' : 'percussionfloh';
    }

    function localScoreUrlGenerator(id) {
        const url = `/kern/${getComposer(id)}-dances/${normalizeId(id)}.krn?${corelliTrioSonatasSha}`;
        return url;
    }

    function githubScoreUrlGenerator(id) {
        const url = `https://github.com/${getGithubUser(id)}/${getComposer(id)}-dances/blob/master/kern/${normalizeId(id)}.krn`;
        return url;
    }

    function githubRawScoreUrlGenerator(id) {
        const url = `https://raw.githubusercontent.com/${getGithubUser(id)}/${getComposer(id)}-dances/master/kern/${normalizeId(id)}.krn`;
        return url;
    }

    function vhvScoreUrlGenerator(id) {
        const url = `https://verovio.humdrum.org/?file=${encodeURIComponent(githubRawScoreUrlGenerator(id))}`;
        return url;
    }

    return {
        localScoreUrlGenerator,
        githubScoreUrlGenerator,
        githubRawScoreUrlGenerator,
        vhvScoreUrlGenerator,
    };
}
